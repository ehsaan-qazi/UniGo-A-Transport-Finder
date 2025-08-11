let data=[
    ["comsats","comsats","No transport needed"],
    ["saddar","comsats","Red Line metro bus from Saddar Metro Station to Faizabad,Green Line Metro Bus from Faizabad to Comsats University Islamabad,Green line Bus ID: FR-08C"]
]
function findTrans(){
    let value = document.getElementById("departure-dropdown").value;
    let value2 = document.getElementById("destination-dropdown").value;
    let departure = document.getElementById("departure-dropdown").options[document.getElementById("departure-dropdown").selectedIndex].text;
    let destination = document.getElementById("destination-dropdown").options[document.getElementById("destination-dropdown").selectedIndex].text; // Gets the visible text
    let result;
    for(let element of data){
        if(element[0]===value && element[1]===value2){
            const resultsContainer = document.querySelector(".search-result-container");
            if (resultsContainer) {
                resultsContainer.classList.remove("hide");
            }

            document.querySelector("#route-1").innerText = `Route 1: ${departure} to ${destination}`;

            // Clear previously generated lines (avoid duplicates on multiple searches)
            const infoContainer = document.querySelector("#result-card-1 .result-info");
            if (infoContainer) {
                infoContainer.querySelectorAll(".result-info-p.generated").forEach(p => p.remove());
            }

            // Add current steps
            let s = element[2].split(",");
            let existingP = document.querySelector("#result-card-1 .result-info .result-info-p");
            for(let i = s.length-1; i>=0; i--){
                let para = document.createElement("p");
                para.textContent = s[i];
                para.setAttribute("class", "result-info-p generated");
                existingP.insertAdjacentElement("afterend", para);
            }
        }
    }
}