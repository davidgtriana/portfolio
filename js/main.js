function loadContent(file) {
  // Get html file to fecth
  fetch(`content_options/${file}.html`)

    // Get the content of the file as a string
    .then((result) => {
      if (result.status !== 200) {
        throw new Error("Bad Server Response")
      }
      return result.text();
    })

    // Put the loaded content into the div
    .then((content) => {
      document.getElementById("wrapper-body").innerHTML = content;
    })

    // Catch errors
    .catch((error) => { console.log(error); });
}

window.onload = function () {
  loadContent('projects');
};

// Use if I'm editing the bottom of the page
//setTimeout(() => document.getElementById("end_page").scrollIntoView(), 500);

