import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  FileView,
  MarkdownView,
  MarkdownSourceView,
  Vault,
  View,
  TFile,
  EditableFileView,
} from "obsidian";
import { findAll, upsertAll, replaceAllMD, setTaskPath } from "taskwarlib";

interface MyPluginSettings {
  taskPath: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  taskPath: "/usr/local/bin/task",
};

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    setTaskPath(this.settings.taskPath);

    this.addRibbonIcon("sheets-in-box", "Task Sync", () => {
      new Notice("Task Sync");
    });

    this.addStatusBarItem().setText("Status Bar Text");

    this.addCommand({
      id: "SynchronizeTasks",
      name: "Synchronize Task Warrior",
      // callback: () => {
      // 	console.log('Simple Callback');
      // },
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            const editTxt = this.editor.getValue();
            const relPath: string = this.relativePath;
            const todos = findAll(editTxt, relPath);
            const updated = upsertAll(todos, relPath, null);
            const newTxt = replaceAllMD(editTxt, updated);
            this.editor.setValue(newTxt);
          }
          return true;
        }
        return false;
      },
    });

    this.addSettingTab(new TWarriorSettingTab(this.app, this));

    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      console.log("codemirror", cm);
    });

    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      console.log("click", evt);
    });

    this.registerInterval(
      window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
    );
  }

  onunload() {
    console.log("unloading plugin");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  get relativePath(): string {
    const view: View = this.app.workspace.activeLeaf.view;
    console.log("view = ", view);

    const sourceView: MarkdownSourceView = (<MarkdownView>view).sourceMode;
    const fileView: EditableFileView = <FileView>view;
    console.log("file view = ", fileView);

    if (fileView) {
      //		console.log("view = ", fileView);
      //		console.log("file  = ", fileView.file);
      //		console.log("path  = ", fileView.file.path);
      const thefile: string = fileView.file.path;
      //	console.log('thefile = '+thefile);

      //	const path = this.app.vault.getResourcePath(thefile);

      return thefile;
    }
    return "";
  }

  get editor(): CodeMirror.Editor {
    const view = this.app.workspace.activeLeaf.view;
    if (!(view instanceof MarkdownView)) return null;

    const sourceView = view.sourceMode;
    return (sourceView as MarkdownSourceView).cmEditor;
  }

  get vault(): Vault {
    return this.app.vault;
  }
}

class TWarriorSettingTab extends PluginSettingTab {
  plugin: MyPlugin;

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Task Warrior Synch Settings" });

    new Setting(containerEl)
      .setName("Task Warrior Path")
      .setDesc("Path to Task Warrior")
      .addText((text) =>
        text
          .setPlaceholder("Enter Path")
          .setValue("/usr/local/bin/path")
          .onChange(async (value) => {
            console.log("Path: " + value);
            this.plugin.settings.taskPath = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
