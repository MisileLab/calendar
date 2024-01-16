import { Accessor, Setter } from "solid-js";

export interface EventDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface Event {
  start: EventDate;
  end: EventDate;
  title: string;
  content: string;
  color: string;
}

export interface SimpleEvent {
  year: number;
  month: number;
  day: number;
  title: string;
  content: string;
  color: string;
  org: Event;
}

export interface DateTimeData {
  date: string,
  time: string
}

export interface DialogSignals {
  title: Accessor<string>,
  setTitle: Setter<string>,
  start: Accessor<DateTimeData>,
  setStart: Setter<DateTimeData>,
  end: Accessor<DateTimeData>,
  setEnd: Setter<DateTimeData>,
  content: Accessor<string>,
  setContent: Setter<string>,
  color: Accessor<string>,
  setColor: Setter<string>
}
