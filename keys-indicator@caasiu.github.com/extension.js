const St = imports.gi.St;
const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Atk = imports.gi.Atk;

//detect the keyboard key press event
const Gdk = imports.gi.Gdk;
const Keymap = Gdk.Keymap.get_default();

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const Gettext = imports.gettext.domain("keys-indicator");
const _ = Gettext.gettext;

let keysIndicator, sideId, indexId, styleId;
let setting = Convenience.getSettings();
let attentionId;
let attentionMode = "highlight-red";

const KeysIndicator = new Lang.Class({
  Name: "KeysIndicator",
  Extends: PanelMenu.Button,

  _init: function() {
    this.parent(0.0, _("KeysIndicator"), true);

    //define 5 label to show the keys status later
    this.capsLock = new St.Label({
      style_class: "label-style",
      y_align: Clutter.ActorAlign.CENTER,
      visible: false,
      text: _("CapsLock")
    });
    //this.capsLock.set_style('color: red; bindex: 1px solid red;');

    this.numLock = new St.Label({
      style_class: "label-style",
      y_align: Clutter.ActorAlign.CENTER,
      visible: false,
      text: _("NumLock")
    });

    //put all the label together
    this.layoutManager = new St.BoxLayout({ style_class: "box-style" });
    //Todo: add 5 label using one line?
    this.layoutManager.add(this.capsLock);
    this.layoutManager.add(this.numLock);

    //add the box to the panel
    this.actor.add_actor(this.layoutManager);
    this.actor.visible = false;
  },

  setActive: function(enable) {
    if (enable) {
      let styleName = setting.get_string("styles");

      if (styleName == "popup") {
        //all hidden by default
        this.actor.visible = false;
        this.capsLock.visible = false;
        this.numLock.visible = false;

        this.numLock.remove_style_class_name("grayout-style");
        this.capsLock.remove_style_class_name("grayout-style");

        this._KeyStatusId = Keymap.connect(
          "state_changed",
          Lang.bind(this, this._popupStyle)
        );
        //when extension was enabled, check whether numLock or capsLock is on
        this._popupStyle();
      }

      if (styleName == "less") {
        //show NUM and CAPS, rest hidden
        this.actor.visible = true;
        this.capsLock.visible = true;
        this.numLock.visible = true;

        this._KeyStatusId = Keymap.connect(
          "state_changed",
          Lang.bind(this, this._lessStyle)
        );
        this._lessStyle();
      }

      if (styleName == "grayout") {
        //show all by default
        this.actor.visible = true;
        this.capsLock.visible = true;
        this.numLock.visible = true;

        this._KeyStatusId = Keymap.connect(
          "state_changed",
          Lang.bind(this, this._grayoutStyle)
        );
        this._grayoutStyle();
      }
    } else {
      this.actor.visible = false;
      Keymap.disconnect(this._KeyStatusId);
    }
  },

  _popupStyle: function() {
    let attentionMode = setting.get_string("highlight-mode");
    let capStatus = Keymap.get_caps_lock_state();
    let numStatus = Keymap.get_num_lock_state();

    if (attentionMode == "highlight-red") {
      if (capStatus || !numStatus) {
        this.actor.visible = true;
      } else {
        //hide all if nothing pressed, but numlock on
        this.actor.visible = false;
      }

      if (capStatus) {
        //normal behavior: hidden when capslock off
        this.capsLock.visible = true;
        this.capsLock.add_style_class_name("attention-on-style");
      } else {
        this.capsLock.visible = false;
        this.capsLock.remove_style_class_name("attention-on-style");
      }

      if (numStatus) {
        //inverted behavior: hidden when numlock on
        this.numLock.visible = false;
        this.numLock.remove_style_class_name("attention-off-style");
      } else {
        this.numLock.visible = true;
        this.numLock.add_style_class_name("attention-off-style");
      }
    } else {
      this.capsLock.remove_style_class_name("attention-on-style");
      this.numLock.remove_style_class_name("attention-off-style");
      if (capStatus || numStatus) {
        this.actor.visible = true;
      } else {
        //hide all if nothing pressed/locked
        this.actor.visible = false;
      }

      if (capStatus) {
        //normal behavior: hidden when capslock off
        this.capsLock.visible = true;
      } else {
        this.capsLock.visible = false;
      }

      if (numStatus) {
        //normal behavior: hidden when numlock off
        this.numLock.visible = true;
      } else {
        this.numLock.visible = false;
      }
    }
  },

  _lessStyle: function() {
    let attentionMode = setting.get_string("highlight-mode");
    let capStatus = Keymap.get_caps_lock_state();
    let numStatus = Keymap.get_num_lock_state();

    //show NUM and CAPS, rest hidden
    this.capsLock.visible = true;
    this.numLock.visible = true;

    if (attentionMode == "highlight-red") {
      if (capStatus) {
        this.capsLock.remove_style_class_name("grayout-style");
        this.capsLock.add_style_class_name("attention-on-style");
      } else {
        this.capsLock.remove_style_class_name("attention-on-style");
        this.capsLock.add_style_class_name("grayout-style");
      }

      if (numStatus) {
        this.numLock.remove_style_class_name("attention-off-style");
      } else {
        this.numLock.add_style_class_name("attention-off-style");
      }
    } else {
      this.capsLock.remove_style_class_name("attention-on-style");
      this.numLock.remove_style_class_name("attention-off-style");
      if (capStatus) {
        this.capsLock.remove_style_class_name("grayout-style");
      } else {
        this.capsLock.add_style_class_name("grayout-style");
      }

      if (numStatus) {
        this.numLock.remove_style_class_name("grayout-style");
      } else {
        this.numLock.add_style_class_name("grayout-style");
      }
    }
  },

  _grayoutStyle: function() {
    let attentionMode = setting.get_string("highlight-mode");
    let capStatus = Keymap.get_caps_lock_state();
    let numStatus = Keymap.get_num_lock_state();

    if (attentionMode == "highlight-red") {
      if (capStatus) {
        this.capsLock.remove_style_class_name("grayout-style");
        this.capsLock.add_style_class_name("attention-on-style");
      } else {
        this.capsLock.remove_style_class_name("attention-on-style");
        this.capsLock.add_style_class_name("grayout-style");
      }

      if (numStatus) {
        this.numLock.remove_style_class_name("attention-off-style");
      } else {
        this.numLock.add_style_class_name("attention-off-style");
      }
    } else {
      this.capsLock.remove_style_class_name("attention-on-style");
      this.numLock.remove_style_class_name("attention-off-style");
      if (capStatus) {
        this.capsLock.remove_style_class_name("grayout-style");
      } else {
        this.capsLock.add_style_class_name("grayout-style");
      }

      if (numStatus) {
        this.numLock.remove_style_class_name("grayout-style");
      } else {
        this.numLock.add_style_class_name("grayout-style");
      }
    }
  },

  destroy: function() {
    this.setActive(false);
    this.parent();
  }
});

//according to panel._addToPanelBox function from Github/Gnome-shell/panel.js
function setPosition() {
  let container = keysIndicator.container;
  container.show();
  let parent = container.get_parent();
  if (parent) parent.remove_actor(container);

  let side = setting.get_string("position-side");
  let index = setting.get_int("position-index");

  switch (side) {
    case "left":
      Main.panel._leftBox.insert_child_at_index(container, index);
      break;
    case "right":
      Main.panel._rightBox.insert_child_at_index(container, index);
      break;
    default:
      Main.panel._rightBox.insert_child_at_index(container, index);
  }

  let destroyId = keysIndicator.connect(
    "destroy",
    Lang.bind(this, function(emitter) {
      emitter.disconnect(destroyId);
      container.destroy();
    })
  );
}

function rePosition() {
  if (keysIndicator) keysIndicator.destroy();

  //have to create a new class, don't know why
  keysIndicator = new KeysIndicator();
  keysIndicator.setActive(true);

  setPosition();
}

function init(metadata) {
  Convenience.initTranslations("keys-indicator");
}

function enable() {
  keysIndicator = new KeysIndicator();
  keysIndicator.setActive(true);
  setPosition();

  sideId = setting.connect(
    "changed::position-side",
    Lang.bind(this, rePosition)
  );
  indexId = setting.connect(
    "changed::position-index",
    Lang.bind(this, rePosition)
  );
  styleId = setting.connect(
    "changed::styles",
    Lang.bind(this, function() {
      keysIndicator.setActive(false);
      keysIndicator.setActive(true);
    })
  );
  attentionId = setting.connect(
    "changed::highlight-mode",
    Lang.bind(this, function() {
      keysIndicator.setActive(false);
      keysIndicator.setActive(true);
    })
  );
}

function disable() {
  keysIndicator.destroy();
  setting.disconnect(sideId);
  setting.disconnect(indexId);
  setting.disconnect(styleId);
  setting.disconnect(attentionId);
}
