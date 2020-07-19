import * as acemodule from "./lib/ace.js";

/* -------------< Ace multi module compat >------------ */

/** @type {String} */
const scriptLocation = getRunningScript()().replace("main.js", "");

setAceModules([
    ["ace/mode/javascript", "lib/mode-javascript.js"],
    ["ace/mode/javascript_worker", "lib/worker-javascript.js"],
    ["ace/ext/error_marker", "lib/ext-error_marker.js"],
    ["ace/ext/language_tools", "lib/ext-language_tools.js"],
    ["ace/theme/twilight", "lib/theme-twilight.js"],
    ["ace/snippets/javascript", "lib/snippets/javascript.js"]
]);

console.log(acemodule);

/**
 * @returns {String} script location
 */
function getRunningScript() {
    return () => {
        return new Error().stack.match(/([^ \n])*([a-z]*:\/\/\/?)*?[a-z0-9\/\\]*\.js/ig)[0];
    };
}
/**
 * @param  {String[]} stringArray
 */
function setAceModules(stringArray) {
    stringArray.forEach((data) => {
        ace.config.setModuleUrl(data[0], scriptLocation.concat(data[1]));
    });
}

/* -------------< End Ace multi module compat >------------ */




Hooks.on('renderMacroConfig', function (macroConfig) {
    /** @type {JQuery} */
    const configElement = macroConfig.element;
    configElement.find('div.form-group.stacked.command').append('<div class="macro-editor" id="macroEditor"></div>');
    if (game.settings.get('macroeditor', 'defaultShow')) {
        configElement.find('.command textarea[name="command"]').css('display', 'none');

        // furnace compat
        const furnace = configElement.find('div.furnace-macro-command');
        if (furnace.length !== 0) {
            furnace.css('display', 'none');
        }
    } else {
        configElement.find('.macro-editor').css('display', "none");
    }

    configElement.find('.sheet-footer').append('<button type="button" class="macro-editor-button" title="Edit in code editor" name="editorButton"><i class="fas fa-terminal"></i></button>');

    let editor = ace.edit("macroEditor");
    editor.setOptions({
        mode: "ace/mode/javascript",
        theme: "ace/theme/twilight",
        showPrintMargin: false,
        enableBasicAutocompletion: true,
        enableSnippets: true,
        enableLiveAutocompletion: true,
        foldStyle: "markbegin"
    });


    configElement.find('.macro-editor-button').on('click', (event) => {
        event.preventDefault();
        if (configElement.find('.macro-editor').css('display') == 'none') {
            configElement.find('.command textarea[name="command"]').css('display', 'none');
            configElement.find('.macro-editor').css('display', 'unset');
            editor.setValue(configElement.find('.command textarea[name="command"]').val(), -1);

            // furnace compat
            const furnace = configElement.find('div.furnace-macro-command');
            if (furnace.length !== 0) {
                furnace.css('display', 'none');
            }

        } else {
            configElement.find('.command textarea[name="command"]').css('display', 'inline-block');
            configElement.find('.macro-editor').css('display', 'none');

            // furnace compat
            const furnace = configElement.find('div.furnace-macro-command');
            if (furnace.length !== 0) {
                furnace.css('display', 'flex');
                furnace.trigger('change');
            }

        }
    });



    editor.setValue(configElement.find('textarea[name="command"]').val(), -1);

    editor.getSession().on('change', () => {
        configElement.find('textarea[name="command"]').val(editor.getSession().getValue());
    });

    editor.commands.addCommand({
        name: "Save",
        bindKey: { win: "Ctrl-S", mac: "Command-S" },
        exec: () => configElement.find('form.editable').trigger('submit')
    });

    editor.commands.addCommand({
        name: "Execute",
        bindKey: { win: "Ctrl-E", mac: "Command-E" },
        exec: () => configElement.find('button.execute').trigger('click')
    });

    new ResizeObserver(() => {
        editor.resize(); editor.renderer.updateFull();
    }).observe(editor.container);

    createMacroConfigHook(macroConfig.id, editor);

});

Hooks.once('init', function () {
    game.settings.register('macroeditor', 'defaultShow', {
        name: "Show Macro editor by default",
        hint: "Shows the code editor by default instead of the default editor",
        default: true,
        type: Boolean,
        scope: "client",
        config: true
    });
});

/**
 * @param  {String} id
 * @param  {AceAjax.Editor} editor
 */
function createMacroConfigHook(id, editor) {
    Hooks.once('closeMacroConfig', function (macroConfig) {
        if (id === macroConfig.id) {
            editor.destroy();
        } else {
            createMacroConfigHook(id, editor);
        }
    });
}




