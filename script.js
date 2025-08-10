let data=[
    ["comsats","comsats","No transport needed"],
    ["saddar","comsats","Metro bus"]
]
function findTrans(){
    let value = document.getElementById("departure-dropdown").value;
    let value2 = document.getElementById("destination-dropdown").value;
    let result;
    for(let element of data){
        if(element[0]===value && element[1]===value2){
            document.getElementById("search-result").innerText = element[2];
        }
    }
}