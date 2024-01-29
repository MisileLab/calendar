import { Accessor, For, JSX, Setter, Show, createEffect, createMemo, createSignal } from "solid-js";
import { VsArrowLeft, VsArrowRight, VsEdit, VsTrash } from "solid-icons/vs";
import { Transition } from "solid-transition-group";
import { SimpleEvent, Event } from "./interfaces";
import { getColor, convertEventToHighlight, handlingButton, convertDateToString, shallowEqual, makeEffectToObject } from "./utils";
import { ContextMenu } from "@kobalte/core";
import { AlertDialogForEvent, CreateEventDialog } from "./dialogs";
import { BaseDirectory, create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import styles from "./app.module.css";

function ContextMenuForEvent(item: SimpleEvent, comp: JSX.Element, events: Accessor<Event[]>, setEvents: Setter<Event[]>) {
  const o = convertDateToString(item.org.start, item.org.end);
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger>{comp}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          class="bg-white dark:bg-ctp-overlay0 glass content outline-none"
          onclick={(e) => {
            e.stopImmediatePropagation();
          }}
        >
          <div class="flex-col flex mr-1">
            <div class="text-xl font-bold dark:text-ctp-text">{`이름: ${item.title}`}</div>
            <div class={styles.subtext}>{`시작: ${o["start"]["full"]}`}</div>
            <div class={styles.subtext}>{`끝: ${o["end"]["full"]}`}</div>
            <div class="flex flex-row-reverse w-full mb-1">
              <button
                onClick={async () => {
                  if (await confirm("정말로 삭제하시겠습니까?")) {
                    const tmp = events().slice();
                    const tmpi = tmp.indexOf(item.org);
                    if (tmpi == -1) {return;}
                    tmp.splice(tmpi, 1);
                    setEvents(tmp);
                  }
                }}
              >
                <VsTrash size={24} />
              </button>
              {AlertDialogForEvent(
                item,
                <div>
                  <VsEdit size={24} />
                </div>,
                events,
                setEvents
              )}
            </div>
          </div>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function dayDisplay(cont: string) {
  return (
    <div class="font-normal h-full flex" style="width: calc(100vw / 7);">
      <div
        class={`mt-auto mb-auto text-center w-full font-semibold ${getColor(
          cont
        )}`}
      >
        {cont}
      </div>
    </div>
  );
}

function getDateList(date: Date) {
  const lastDate = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
  const dateList = [];
  for (let i = 1; i <= lastDate; i++) {
    dateList.push(i);
  }
  return dateList;
}

function daySingle(
  orge: Accessor<Event[]>,
  setorge: Setter<Event[]>,
  num: number | string = "",
  today: boolean = false,
  events: Record<string, SimpleEvent[]>,
  index: string
) {
  const td = new Date();
  const tdjson = {"date": td.toISOString().substring(0, 10), "time": td.toISOString().substring(11, 16)}
  const [title, setTitle] = createSignal("");
  const [start, setStart] = createSignal(tdjson);
  const [end, setEnd] = createSignal(tdjson);
  const [content, setContent] = createSignal("");
  const [modal, setModalVisible] = createSignal(false);
  const [color, setColor] = createSignal("c0ffee");
  return (
    <div
      style="width: calc(100vw / 7)"
      onClick={() => {
        setModalVisible(true);
      }}
    >
      <div class="mb-auto text-right mt-2 font-semibold flex flex-row-reverse">
        <div
          class={`${
            today ? "bg-red-400 dark:text-black" : ""
          } w-6 h-6 rounded-full text-center dark:text-ctp-subtext0`}
        >
          {num}
        </div>
      </div>
      <For each={events[index]}>
        {(item) => {
          const a = (
            <div
              class="text-black text-xl text-center"
              style={`background-color: #${item.color}`}
            >
              {item.title}
            </div>
          );
          return ContextMenuForEvent(item, a, orge, setorge);
        }}
      </For>
      <Transition name="trans" onAfterExit={async ()=>{
        if (title() === '') {return;}
        const res = makeEffectToObject(start(), end(), title(), content(), color());
        if (res === false) {await message("시작 날짜가 끝나는 날짜보다 늦습니다."); return;}
        setorge([...orge(), res]);
      }}>
        <Show when={modal()}>{CreateEventDialog(modal, setModalVisible, {title, setTitle, start, setStart, end, setEnd, content, setContent, color, setColor})}</Show>
      </Transition>
    </div>
  );
}

function day(date: Date, events: Accessor<Event[]>, setEvents: Setter<Event[]>) {
  const highlights = createMemo(() => {
    return convertEventToHighlight(events());
  }, [], {
    equals: (prev, next) => shallowEqual(prev, next)
  });
  const fy = date.getFullYear();
  const fm = date.getMonth() + 1;
  const fd = date.getDate();
  const tmcmp =
    fm - 1 == new Date().getMonth() && fy == new Date().getFullYear();
  const _dateList: number[] = getDateList(date);
  const dateList: JSX.Element[][] = [[]];
  const prestart = new Date(fy, fm - 1, 1).getDay();
  for (let i = 0; i < prestart; i++) {
    dateList[0].push(daySingle(events, setEvents, "", false, highlights(), ""));
  }
  for (let i = 0; i < _dateList.length; i++) {
    const d = _dateList[i];
    if (new Date(fy, fm - 1, d).getDay() == 0) {
      if (dateList[dateList.length - 1].length !== 0) {
        dateList.push([]);
      }
      dateList[dateList.length - 1].push(
        daySingle(events, setEvents, d, tmcmp && fd == d, highlights(), `${fy}:${fm}:${d}`)
      );
    } else {
      if (dateList.length == 0) {
        dateList.push([]);
      }
      dateList[dateList.length - 1].push(
        daySingle(events, setEvents, d, tmcmp && fd == d, highlights(), `${fy}:${fm}:${d}`)
      );
    }
  }
  return (
    <For each={dateList}>
      {(item) => {
        return (
          <div
            class="flex flex-row h-1/5 border-gray-700 dark:border-white border-solid"
            style="border-top-width: 0.5px;"
          >
            <For each={item}>{(item) => item}</For>
          </div>
        );
      }}
    </For>
  );
}

function App() {
  const dates = ["일", "월", "화", "수", "목", "금", "토"];
  const today = new Date();
  const [events, setEvents] = createSignal<Event[]>([]);
  const [date, setDate] = createSignal([today]);
  const [comp, setComp] = createSignal(<div class="h-full flex flex-col">{day(date()[0], events, setEvents)}</div>);
  let loaded = false;
  createEffect(()=>{
    setComp(<div class="h-full flex flex-col">{day(date()[0], events, setEvents)}</div>);
  })
  createEffect(async () => {
    if (await exists("data.json", { baseDir: BaseDirectory.AppData })) {
      setEvents(JSON.parse(await readTextFile("data.json", { baseDir: BaseDirectory.AppData })));
    } else {
      await create("data.json", { baseDir: BaseDirectory.AppData })
      await writeTextFile("data.json", "[]", { baseDir: BaseDirectory.AppData });
    }
    loaded = true;
  })
  createEffect(async (ev: Promise<void> | undefined) => {
    // simple hack that works, but typescript and me doesnt know it
    if (shallowEqual(ev as unknown as Event[], events()) || !loaded) {return;}
    await writeTextFile("data.json", JSON.stringify(events()), { baseDir: BaseDirectory.AppData });
  })

  return (
    <div>
      <div class="bg-white dark:bg-ctp-surface0 w-screen h-screen flex flex-col">
        <div class="bg-gray-300 dark:bg-ctp-surface1 w-screen flex flex-col h-32">
          <div class="m-auto flex flex-row gap-2 dark:text-ctp-text">
            <button
              class="h-full w-6"
              onClick={() => handlingButton(date()[0], setDate, -1)}
            >
              <VsArrowLeft class={styles["w-h-full"]} />
            </button>
            <div class="text-4xl font-bold">{`${date()[0].getFullYear()}.${
              date()[0].getMonth() + 1
            }`}</div>
            <button
              class="h-full w-6"
              onClick={() => handlingButton(date()[0], setDate, 1)}
            >
              <VsArrowRight class={styles["w-h-full"]} />
            </button>
          </div>
          <div class="flex flex-row w-full h-1/3">
            <For each={dates}>
              {(item) => {
                return dayDisplay(item);
              }}
            </For>
          </div>
        </div>
        {comp()}
      </div>
    </div>
  );
}

export default App;
