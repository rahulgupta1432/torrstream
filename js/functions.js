(async function fetchLatestVersion() {
    const res = await fetch(
      "https://api.github.com/repos/Zenda-Cross/vega-app/releases/latest"
    );
    const data = await res.json();
    const version = data.tag_name;
    
    // Configure base URLs for each version type
    const getVariantUrl = (ver, type) => {
      const baseUrl = `https://github.com/Zenda-Cross/vega-app/releases/download/${ver}`;
      switch(type) {
        case 'stable': return `${baseUrl}/Vega-universal-${ver}.apk`;
        case 'beta': return `${baseUrl}/Vega-arm64-v8a-${ver}.apk`;
        case 'alpha': return `${baseUrl}/Vega-armeabi-v7a-${ver}.apk`;
      }
    };
  
    // Update main download button with latest universal build
    const downloadBtns = document.querySelectorAll("#download-btn");
    downloadBtns.forEach(btn => {
      btn.setAttribute("href", getVariantUrl(version, 'stable'));
    });
  
    // Update version text and changelog
    const versionTxt = document.querySelector("#version-txt");
    versionTxt.innerHTML = version;
  
    const changelog = document.querySelector("#change-log");
    const changes = data.body.replaceAll("- ", "").split("\r\n");
    changes.forEach((change) => {
      if (change.trim()) {
        const li = document.createElement("li");
        li.innerHTML = change;
        changelog.appendChild(li);
      }
    });
  
    // Fetch all releases for version history
    const allRes = await fetch("https://api.github.com/repos/Zenda-Cross/vega-app/releases");
    const allReleases = await allRes.json();
  
    // Handle version selection
    const versionBtns = document.querySelectorAll('.version-select-btn');
    versionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        versionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        const versionType = btn.dataset.version;
        const versionList = document.querySelector("#version-list");
        versionList.innerHTML = '';
        
        // Show all versions with the selected build type
        allReleases.forEach(release => {
          const releaseVer = release.tag_name;
          const apkUrl = getVariantUrl(releaseVer, versionType);
          
          versionList.innerHTML += `
            <div class="version-option">
              <div class="version-header">
                <div class="tw-flex tw-flex-col tw-gap-1">
                  <div class="tw-text-lg tw-font-medium">${releaseVer}</div>
                  <div class="tw-text-sm tw-text-gray-400 tw-mb-3">${
                    versionType === 'stable' ? 'Universal Build' :
                    versionType === 'beta' ? 'ARM64 v8a Build' :
                    'ARMv7a Build'
                  }</div>
                </div>
                <a href="${apkUrl}" class="version-download-btn">
                  <i class="bi bi-download"></i>
                </a>
              </div>
              <div class="tw-h-[1px] tw-bg-purple-800/20 tw-my-3"></div>
              <div class="version-changelog tw-mt-2 tw-text-gray-300">
                <div class="tw-text-sm tw-mb-2 tw-text-gray-400">Changelog:</div>
                <ul class="tw-list-disc tw-pl-4">
                  ${release.body.split("\r\n").map(change => 
                    change.trim() ? `<li class="tw-mb-1">${change.replace("- ","")}</li>` : ''
                  ).join("")}
                </ul>
              </div>
            </div>
          `;
        });
      });
    });
  
    // Show universal/stable versions by default
    document.querySelector('[data-version="stable"]')?.click();
  })();
  
  // Toggle dropdown visibility
  function toggleVersions(event) {
    const dropdown = document.querySelector("#version-dropdown");
    dropdown.classList.toggle("show");
    
    // Handle mobile backdrop
    if (window.innerWidth <= 480) {
      document.body.classList.toggle("dropdown-open");
    }
    
    if(dropdown.classList.contains("show")) {
      document.addEventListener('click', closeDropdown);
    }
  }
  
  function closeDropdown(event) {
    const dropdown = document.querySelector("#version-dropdown");
    const container = document.querySelector(".version-dropdown-container");
    
    if (!container.contains(event.target)) {
      dropdown.classList.remove("show");
      document.body.classList.remove("dropdown-open");
      document.removeEventListener('click', closeDropdown);
    }
  }
  
  // Add window resize handler
  window.addEventListener('resize', () => {
    if (window.innerWidth > 480) {
      document.body.classList.remove("dropdown-open");
    }
  });
  
  // Fetch all releases and handle version history
  async function fetchReleases() {
    const res = await fetch(
      "https://api.github.com/repos/Zenda-Cross/vega-app/releases"
    );
    const releases = await res.json();
    
    // Categorize releases
    const categorizedReleases = {
      stable: releases.filter(r => !r.prerelease && !r.tag_name.includes('beta') && !r.tag_name.includes('alpha')),
      beta: releases.filter(r => r.tag_name.includes('beta')),
      alpha: releases.filter(r => r.tag_name.includes('alpha'))
    };
  
    // Get latest stable release for default download
    const latestStable = categorizedReleases.stable[0];
    const latestAsset = latestStable.assets?.pop();
    const latestUrl = latestAsset?.browser_download_url;
    const latestVersion = latestStable.tag_name;
  
    // Update download buttons
    const downloadBtns = document.querySelectorAll("#download-btn");
    downloadBtns.forEach((btn) => {
      btn.setAttribute("href", latestUrl);
    });
  
    // Update version text
    const versionTxt = document.querySelector("#version-txt");
    versionTxt.innerHTML = latestVersion;
  
    // Update changelog for latest version
    updateChangelog(latestStable);
  
    // Setup version select buttons
    const versionBtns = document.querySelectorAll('.version-select-btn');
    versionBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update active state
        versionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
  
        // Filter versions
        const versionType = btn.dataset.version;
        const filteredReleases = categorizedReleases[versionType];
        
        // Clear and repopulate version list
        const versionList = document.querySelector("#version-list");
        versionList.innerHTML = '';
        
        filteredReleases.forEach((release) => {
          const option = createVersionOption(release);
          versionList.appendChild(option);
        });
      });
    });
  
    // Initially populate with stable versions
    const versionList = document.querySelector("#version-list");
    categorizedReleases.stable.forEach((release) => {
      const option = createVersionOption(release);
      versionList.appendChild(option);
    });
  }
  
  function updateChangelog(release) {
    const changelog = document.querySelector("#change-log");
    changelog.innerHTML = '';
    const changes = release.body.replaceAll("- ", "").split("\r\n");
    changes.forEach((change) => {
      if (change.trim()) {
        const li = document.createElement("li");
        li.innerHTML = change;
        changelog.appendChild(li);
      }
    });
  }
  
  function createVersionOption(release) {
    const option = document.createElement("div");
    option.className = "version-option";
    
    const header = document.createElement("div");
    header.className = "version-header";
    header.innerHTML = `
      <span>${release.tag_name}</span>
      <a href="${release.assets[0]?.browser_download_url}" class="version-download-btn">
        <i class="bi bi-download"></i>
      </a>
    `;
  
    const changeLog = document.createElement("div");
    changeLog.className = "version-changelog";
    changeLog.innerHTML = `
      <ul>
        ${release.body.split("\r\n").map(change => `<li>${change.replace("- ","")}</li>`).join("")}
      </ul>
    `;
  
    option.appendChild(header);
    option.appendChild(changeLog);
    return option;
  }
  
  // Initialize
  fetchReleases();
  