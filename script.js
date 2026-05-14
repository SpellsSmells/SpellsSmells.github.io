// Paste your exact Raw GitHub Gist Link inside the quotes below
const GIST_URL = "https://gist.githubusercontent.com/SpellsSmells/2ec3f69e05b539ab8aafecc217cf1ce9/raw/f5e61ff17a96e6c4b9c8698a10804755f2d06a3e/map-data.txt";

const TAG_AREAS = {
    "menu-item-a1fn2": "291,267 344,267 344,360 322,361",
    "menu-item-a1fn2n": "346,196 323,262 290,264 266,196",
    "menu-item-a1fn2fn": "266,193 344,195 411,1 198,0",
    "menu-item-a1fn2fne": "412,2 548,1 470,232 406,267 404,197 347,195",
    "menu-item-a1fn2ne": "324,262 346,193 402,198 403,265 345,294 346,262",
    "menu-item-a1fn2e": "347,295 403,265 403,363 345,334",
    "menu-item-a1fn2se": "324,363 333,390 404,396 405,363 347,334 346,360",
    "menu-item-a1fn2fe": "470,233 404,266 403,363 422,371",
    "menu-item-a1fn2fse": "404,360 421,371 416,393 401,393",
    "menu-item-a1n2se": "334,394 348,432 403,431 405,391",
    "menu-item-a12fse": "358,466 413,465 414,557 391,561",
    "menu-item-a1e2fse": "413,533 415,490 471,459 472,560",
    "menu-item-a1se2fse": "414,531 471,560 474,630 417,630 391,559 414,559",
    "menu-item-a12fs": "357,466 335,465 331,559 392,560",
    "menu-item-a1s2fs": "356,558 391,558 414,630 333,628",
    "menu-item-a1sw2fs": "352,560 329,560 335,528 277,559 272,628 331,630",
    "menu-item-a1w2fs": "274,558 276,462 333,491 334,528",
    "menu-item-a1nw2fs": "277,463 276,433 344,433 358,460 333,464 334,491",
    "menu-item-a1nw2s": "345,433 331,391 276,390 276,433",
    "menu-item-a1fnw2": "321,359 287,266 265,267 267,363",
    "menu-item-a1fnw2nw": "287,266 263,198 207,195 207,265 266,291 264,265",
    "menu-item-a1fnw2fnw": "266,195 196,2 2,0 1,163 206,266 208,193",
    "menu-item-a1fnw2fw": "208,363 207,267 2,165 1,327 141,394",
    "menu-item-a1fnw2w": "266,334 263,291 208,267 207,361",
    "menu-item-a1fnw2fs": "276,462 276,433 264,434 258,451",
    "menu-item-a1fnw2fsw": "138,395 257,455 266,433 208,432 208,362",
    "menu-item-a1fw2fs": "276,463 273,560 208,593 256,454",
    "menu-item-a1fw2fsw": "256,456 140,395 0,464 0,698 206,595",
    "menu-item-a1fw2fw": "140,394 2,327 2,460",
    "menu-item-a1fsw2fsw": "208,594 2,699 2,997 69,997",
    "menu-item-a1fsw2fs": "274,560 211,590 72,996 206,997 333,630 273,630",
    "menu-item-a1fs2fs": "333,631 414,632 539,997 208,996",
    "menu-item-a1fse2fse": "416,630 476,634 472,557 1000,822 1000,996 542,993",
    "menu-item-a1fe2fse": "473,555 473,460 538,431 997,657 1000,819",
    "menu-item-a1fne2fe": "425,370 470,231 932,2 997,2 998,198 538,428",
    "menu-item-a1fne2fne": "472,229 550,2 928,2",
    "menu-item-a1fe2fe": "540,429 997,200 994,654",
    "menu-item-a1fnw2sw": "265,334 207,360 208,431 266,431 288,362 265,362",
    "menu-item-a1fnw2s": "323,361 289,363 263,433 277,435 277,396 334,393",
    "menu-item-a1ne2fse": "388,465 414,464 414,492 473,465 471,391 416,395",
    "menu-item-a1fne2fse": "539,429 424,371 415,390 470,391 472,462",
    "menu-item-a1n2fse": "345,432 357,467 388,465 416,391 405,393 402,433",
};

const body = document.getElementById('main-body');
const allAreaIds = Object.keys(TAG_AREAS);
let lastMtime = 0;

function buildSVG() {
    const svgContainer = document.getElementById('map-svg');
    let svgShapes = "";
    for (const [tagId, points] of Object.entries(TAG_AREAS)) {
        svgShapes += `<polygon id="poly-${tagId}" class="map-area ${tagId}" ` +
                     `points="${points}" style="--base-op: 0; stroke: rgba(0,0,0,0); stroke-width: 0;" ` +
                     `onmouseover="syncHighlight('${tagId}')" ` +
                     `onmouseout="syncUnhighlight('${tagId}')"/>`;
    }
    svgContainer.innerHTML = svgShapes;
}

function updateTimeCounter() {
    if (lastMtime === 0) return;
    const diff = Math.floor(Date.now() / 1000) - lastMtime;
    let msg = diff < 60 ? diff + "s ago" : Math.floor(diff/60) + "min ago";
    document.getElementById('time-ago').innerText = msg;
}

async function refreshData() {
    try {
        // Cache bust link to grab updates directly from Github server instantly
        const response = await fetch(GIST_URL + '?t=' + new Date().getTime());
        const rawText = await response.text();
        
        // Break lines into arrays, ignoring blank rows
        const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) return;

        let peopleArray = [];
        let countsMap = {};
        let totalCount = lines.length;
        let fileTimestamp = 0;

        lines.forEach(line => {
            const columns = line.split(",");
            if (columns.length < 8) return; // Ignore formatting drops

            const name = columns[1];
            const profession = columns[2];
            const level = columns[3];
            const locationText = columns[5];
            const dateStr = columns[6]; // Format: "2026-05-13 22:02"
            const tagId = columns[7].trim();

            // Populate text metrics array
            peopleArray.push({
                name: name,
                level: " " + level,
                //extra: `${profession}`,
                extra: profession,
                tag: tagId
            });

            // Tally map metrics
            countsMap[tagId] = (countsMap[tagId] || 0) + 1;

            // Turn string date structure into a manageable unix baseline sequence
            const parsedTime = Math.floor(Date.parse(dateStr.replace(" ", "T")) / 1000);
            if (parsedTime > fileTimestamp) {
                fileTimestamp = parsedTime;
            }
        });

        // Skip render step if records have not actually altered
        if (fileTimestamp === lastMtime) return;
        lastMtime = fileTimestamp;

        // 1. Render data block sidebar list element
        const list = document.getElementById('people-list');
        list.innerHTML = peopleArray.map(p => `
            <li class="list-item ${p.tag}" 
                onmouseover="syncHighlight('${p.tag}')" 
                onmouseout="syncUnhighlight('${p.tag}')">
                <strong>${p.name}</strong> ${p.level} <span style="color:#666; font-size:0.9em;">${p.extra}</span>
            </li>`).join('');

        // 2. Map opacity distribution setup
        const maxOp = 0.8;
        allAreaIds.forEach(tag => {
            const poly = document.getElementById('poly-' + tag);
            if (poly) {
                const count = countsMap[tag] || 0;
                if (count > 0) {
                    const op = (count / totalCount) * maxOp;
                    poly.style.setProperty('--base-op', op);
                    poly.style.stroke = "rgba(255, 255, 255, 0.8)";
                    poly.style.strokeWidth = "4";
                } else {
                    poly.style.setProperty('--base-op', 0);
                    poly.style.stroke = "rgba(0,0,0,0)";
                    poly.style.strokeWidth = "0";
                }
            }
        });
    } catch (e) { 
        console.error("Gist processing sequence hit an issue:", e); 
    }
}

function syncHighlight(tag) {
    body.classList.add('interaction-mode');
    document.querySelectorAll('.' + tag).forEach(el => el.classList.add('active-list'));
    const poly = document.getElementById('poly-' + tag);
    if (poly) poly.classList.add('active-area');
}

function syncUnhighlight(tag) {
    body.classList.remove('interaction-mode');
    document.querySelectorAll('.' + tag).forEach(el => el.classList.remove('active-list'));
    const poly = document.getElementById('poly-' + tag);
    if (poly) poly.classList.remove('active-area');
}

buildSVG();
setInterval(refreshData, 5000); // Check Gist every 5 seconds
setInterval(updateTimeCounter, 1000);
refreshData();