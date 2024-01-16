{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };
  
  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay)
        (final: prev: {
          rustToolchain = prev.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml;
        })];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        libraries = with pkgs; [
          webkitgtk_4_1
          gtk4
          cairo
          gdk-pixbuf
          glib
          dbus
          openssl_3
          librsvg
        ];
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            curl
            wget
            pkg-config
            dbus
            openssl_3
            glib
            gtk4
            libsoup_3
            webkitgtk_4_1
            librsvg
            rustToolchain
            glib-networking
          ];

          XDG_DATA_DIRS = let                                                                                                                                                                                                                                                                                                
            base = pkgs.lib.concatMapStringsSep ":" (x: "${x}/share") [                                                                                                                                                                                                                                                      
              pkgs.gnome.adwaita-icon-theme                                                                                                                                                                                                                                                                                  
              pkgs.shared-mime-info                                                                                                                                                                                                                                                                                          
            ];
            gsettings_schema = pkgs.lib.concatMapStringsSep ":" (x: "${x}/share/gsettings-schemas/${x.name}") [
              pkgs.glib
              pkgs.gsettings-desktop-schemas
              pkgs.gtk3
            ];
          in "${base}:${gsettings_schema}";

          shellHook =
            let
              joinLibs = libs: builtins.concatStringsSep ":" (builtins.map (x: "${x}/lib") libs);
              libs = joinLibs libraries;
            in
            ''
              export LD_LIBRARY_PATH=${libs}:$LD_LIBRARY_PATH
              export GIO_MODULE_DIR="${pkgs.glib-networking}/lib/gio/modules/"
              export XDG_DATA_DIRS=${pkgs.gsettings-desktop-schemas}/share/gsettings-schemas/${pkgs.gsettings-desktop-schemas.name}:${pkgs.gtk3}/share/gsettings-schemas/${pkgs.gtk3.name}:$XDG_DATA_DIRS
              export WEBKIT_DISABLE_COMPOSITING_MODE=1
              export RUST_SRC_PATH="$(rustc --print sysroot)/lib/rustlib/src/rust/src"
            '';
        };
      });
}
