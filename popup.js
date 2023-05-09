(async () => {
  async function saveFolders(folders) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ savedFolders: folders }, () => {
        resolve();
      });
    });
  }

  async function loadFolders() {
    return new Promise((resolve) => {
      chrome.storage.local.get("savedFolders", (result) => {
        resolve(result.savedFolders || []);
      });
    });
  }

  async function displayFolders(folders) {
    const folderTemplate = document.getElementById("folder_template");
    const folderElements = new Set();

    for (const folder of folders) {
      const element = folderTemplate.content.firstElementChild.cloneNode(true);

      element.querySelector(".folder-name").textContent = folder.name;
      element.querySelector(".folder-tabs").textContent = folder.tabs
        .map((tab) => tab.title.split("-")[0].trim())
        .join(", ");

      element.querySelector(".open-folder").addEventListener("click", async () => {
        await openTabs(folder.tabs);
      });

      element.querySelector(".delete-folder").addEventListener("click", async () => {
        await saveFolders(folders.filter((f) => f.name !== folder.name));
        location.reload();
      });
      
      element.querySelector(".folder-name").addEventListener("click", async () => {
        const newName = prompt("Enter a new name for the folder:", folder.name);
        if (newName) {
          folder.name = newName;
          await saveFolders(folders);
          location.reload();
        }
      });
      folderElements.add(element);
    }

    document.querySelector("ul").append(...folderElements);
  }

  async function openTabs(tabs) {
    const openedTabs = await Promise.all(
      tabs.map((tab, index) => chrome.tabs.create({ url: tab.url, active: index === 0 }))
    );
    await chrome.windows.update(openedTabs[0].windowId, { focused: true });
  }

  const savedFolders = await loadFolders();
  await displayFolders(savedFolders);

  const saveButton = document.querySelector("#save-tabs");
  saveButton.addEventListener("click", async () => {
    const folderName = prompt("Enter a name for the folder:");
    if (folderName) {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tabsToSave = tabs.map((tab) => ({
        url: tab.url,
        title: tab.title,
      }));

      await saveFolders([...savedFolders, { name: folderName, tabs: tabsToSave }]);
      location.reload();
    }
  });

  const openAllButton = document.querySelector("#open-all-tabs");
  openAllButton.addEventListener("click", async () => {
    const allTabs = savedFolders.reduce((acc, folder) => acc.concat(folder.tabs), []);
    await openTabs(allTabs);
  });
})();
