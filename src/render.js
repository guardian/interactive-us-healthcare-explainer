import rp from "request-promise"


export async function render() {
	const data = await rp({uri: "https://interactive.guim.co.uk/docsdata-test/1RzyDQJP2jG7wHVsy09vxMh73MkEXSz2P-O_wOJ1TLYk.json", json: true});

	const text = data.paragraphs.reduce((t, p) => t + `<div class="text-wrapper"><div class="p-wrapper"><p>${p}</p></div></div>`, "");

    return `<div class="interactive-chart">
    			<div class="chart-text">
    				${text}
    			</div>
    			<svg></svg>
    		</div><svg id="hidden-svg"><path></path></svg>
    		<div class="interactive-chart-2"></div>`;
}