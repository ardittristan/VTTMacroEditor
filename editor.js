/* -------------< Ace >------------ */
Hooks.once("init", () => {
  ["ace/mode/javascript", "ace/ext/language_tools", "ace/ext/error_marker", "ace/theme/twilight", "ace/snippets/javascript"].forEach((s) => ace.config.loadModule(s));
});
/* -------------< End Ace >------------ */

Hooks.on("init", () => {
  Macros.registerSheet?.("macroeditor", AceMacroConfig, {
    makeDefault: true,
    label: "Ace Macro Editor",
    // types: ["script", "chat"],
  });
});

class AceMacroConfig extends MacroConfig {
  async _render(...args) {
    await super._render(...args);

    const configElement = this.element;

    configElement
      .find("div.form-group.stacked.command")
      .append(
        `<button type="button" class="macro-editor-expand" title="Expand Editor"><i class="fas fa-expand-alt"></i></button><div class="macro-editor" id="macroEditor-${this.object.id}"></div>`
      );
    if (game.settings.get("macroeditor", "defaultShow")) {
      configElement.find('.command textarea[name="command"]').css("display", "none");
      const furnace = this.element.find("div.furnace-macro-command");
      if (furnace.length !== 0) {
        furnace.css("display", "none");
      }
    } else {
      configElement.find(".macro-editor").css("display", "none");
      configElement.find(".macro-editor-expand").css("display", "none");
    }

    configElement
      .find(".sheet-footer")
      .append('<button type="button" class="macro-editor-button" title="Toggle Code Editor" name="editorButton"><i class="fas fa-terminal"></i></button>');

    let editor = (this.editor = ace.edit(`macroEditor-${this.object.id}`));

    this.editor.session.on("changeMode", function (e, session) {
      if ("ace/mode/javascript" === session.getMode().$id) {
        if (!!session.$worker) {
          session.$worker.send("setOptions", [
            {
              esversion: 9,
              esnext: false,
            },
          ]);
        }
      }
    });

    // Merge ace-lib user-settings with module settings
    this.editor.setOptions(
      mergeObject(ace.userSettings, {
        mode: "ace/mode/javascript",
      })
    );

    configElement.find(".macro-editor-button").on("click", (event) => {
      event.preventDefault();
      if (configElement.find(".macro-editor").css("display") == "none") {
        configElement.find('.command textarea[name="command"]').css("display", "none");
        configElement.find(".macro-editor").css("display", "");
        configElement.find(".macro-editor-expand").css("display", "");
        this.editor.setValue(configElement.find('.command textarea[name="command"]').val(), -1);

        // furnace compat / advanced macros
        const furnace = configElement.find("div.furnace-macro-command");
        if (furnace.length !== 0) {
          furnace.css("display", "none");
        }
      } else {
        configElement.find('.command textarea[name="command"]').css("display", "");
        configElement.find(".macro-editor").css("display", "none");
        configElement.find(".macro-editor-expand").css("display", "none");

        // furnace compat / advanced macros
        const furnace = configElement.find("div.furnace-macro-command");
        if (furnace.length !== 0) {
          furnace.css("display", "");
          furnace.trigger("change");
        }
      }
    });

    configElement.find(".macro-editor-expand").on("click", (event) => {
      event.preventDefault();
      if (configElement.find(".macro-editor").hasClass("fullscreen")) {
        configElement.find(".macro-editor").removeClass("fullscreen");
        configElement.find(".macro-editor-expand").removeClass("fullscreen");
        configElement.find(".macro-editor-expand").prop("title", "Expand Editor");
        configElement.find(".macro-editor-expand i.fas.fa-compress-alt").attr("class", "fas fa-expand-alt");
        configElement.find(".window-resizable-handle").css("display", "");
      } else {
        configElement.find(".macro-editor").addClass("fullscreen");
        configElement.find(".macro-editor-expand").addClass("fullscreen");
        configElement.find(".macro-editor-expand").prop("title", "Shrink Editor");
        configElement.find(".macro-editor-expand i.fas.fa-expand-alt").attr("class", "fas fa-compress-alt");
        configElement.find(".window-resizable-handle").css("display", "none");
      }
    });

    this.editor.setValue(configElement.find('textarea[name="command"]').val(), -1);

    this.editor.getSession().on("change", () => {
      configElement.find('textarea[name="command"]').val(editor.getSession().getValue());
    });

    this.editor.commands.addCommand({
      name: "Save",
      bindKey: { win: "Ctrl-S", mac: "Command-S" },
      exec: () => configElement.find("form.editable").trigger("submit"),
    });

    this.editor.commands.addCommand({
      name: "Execute",
      bindKey: { win: "Ctrl-E", mac: "Command-E" },
      exec: () => configElement.find("button.execute").trigger("click"),
    });

    // watch for resizing of editor
    new ResizeObserver(() => {
      editor.resize();
      editor.renderer.updateFull();
    }).observe(this.editor.container);
  }

  close(...args) {
    this.editor.destroy();
    super.close(...args);
  }
}

Hooks.once("init", function () {
  game.settings.register("macroeditor", "defaultShow", {
    name: "Show Macro editor by default",
    hint: "Shows the code editor by default instead of the default editor",
    default: true,
    type: Boolean,
    scope: "client",
    config: true,
  });
});

// Item Macro Compat
Hooks.once("init", async function () {
  // only trigger if item macro is active and the compatible version isn't V9 yet
  if (!game.modules.get("itemacro")?.active || game.modules.get("itemacro")?.data?.compatibleCoreVersion?.match(/\./g)?.length !== 2) return;

  let classLoc = game.modules.get("itemacro")?.esmodules?.[0]?.replace("hooks", "ItemMacroConfig");
  if (classLoc) {
    let theClass = (await import(window.location.origin + "/" + classLoc)).ItemMacroConfig;
    theClass.prototype._render = AceMacroConfig.prototype._render;
    theClass.prototype.close = AceMacroConfig.prototype.close;
  }
});
