function loadContent (file,section) {
  let sectionToUse = "container-section1";
    // (A) FETCH "DUMMY.HTML"
    fetch("data/"+file+".html")
    
    // (B) RETURN THE RESULT AS TEXT
    .then((result) => {
      if (result.status != 200) { throw new Error("Bad Server Response"); }
      return result.text();
    })
   
    // (C) PUT LOADED CONTENT INTO <DIV>
    .then((content) => {
      if (section == 1) { 
        eraseSection2();
      }else{
        sectionToUse = "container-section2";
      }
      document.getElementById(sectionToUse).innerHTML = content;
    })
   
    // (D) HANDLE ERRORS
    .catch((error) => { console.log(error); });
}

function eraseSection2(){
  fetch("data/empty.html")
  .then((result) => {
    if (result.status != 200) { throw new Error("Bad Server Response"); }
    return result.text();
  })
  .then((content) => {
    document.getElementById("container-section2").innerHTML = content;
  })
  .catch((error) => { console.log(error); });
}

window.onload = function() {
  loadContent ('projects',1);
};

