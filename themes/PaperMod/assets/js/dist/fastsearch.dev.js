"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var params = _interopRequireWildcard(require("@params"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var fuse; // holds our search engine

var resList = document.getElementById('searchResults');
var sInput = document.getElementById('searchInput');
var first,
    last,
    current_elem = null;
var resultsAvailable = false; // load our search index

window.onload = function () {
  var xhr = new XMLHttpRequest();

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        var data = JSON.parse(xhr.responseText);

        if (data) {
          // fuse.js options; check fuse.js website for details
          var options = {
            distance: 100,
            threshold: 0.4,
            ignoreLocation: true,
            keys: ['title', 'permalink', 'summary', 'content']
          };
          if (params.fuseOpts) options = params.fuseOpts;
          fuse = new Fuse(data, options); // build the index from the json file
        }
      } else {
        console.log(xhr.responseText);
      }
    }
  };

  xhr.open('GET', "../index.json");
  xhr.send();
};

function activeToggle(ae) {
  document.querySelectorAll('.focus').forEach(function (element) {
    // rm focus class
    element.classList.remove("focus");
  });

  if (ae) {
    ae.focus();
    document.activeElement = current_elem = ae;
    ae.parentElement.classList.add("focus");
  } else {
    document.activeElement.parentElement.classList.add("focus");
  }
}

function reset() {
  resultsAvailable = false;
  resList.innerHTML = sInput.value = ''; // clear inputbox and searchResults

  sInput.focus(); // shift focus to input box
} // execute search as each character is typed


sInput.onkeyup = function (e) {
  // run a search query (for "term") every time a letter is typed
  // in the search box
  if (fuse) {
    var results = fuse.search(this.value.trim()); // the actual query being run using fuse.js

    if (results.length !== 0) {
      // build our html if result exists
      var resultSet = ''; // our results bucket

      for (var item in results) {
        resultSet += "<li class=\"post-entry\"><header class=\"entry-header\">".concat(results[item].item.title, "&nbsp;\xBB</header>") + "<a href=\"".concat(results[item].item.permalink, "\" aria-label=\"").concat(results[item].item.title, "\"></a></li>");
      }

      resList.innerHTML = resultSet;
      resultsAvailable = true;
      first = resList.firstChild;
      last = resList.lastChild;
    } else {
      resultsAvailable = false;
      resList.innerHTML = '';
    }
  }
};

sInput.addEventListener('search', function (e) {
  // clicked on x
  if (!this.value) reset();
}); // kb bindings

document.onkeydown = function (e) {
  var key = e.key;
  var ae = document.activeElement;
  var inbox = document.getElementById("searchbox").contains(ae);

  if (ae === sInput) {
    var elements = document.getElementsByClassName('focus');

    while (elements.length > 0) {
      elements[0].classList.remove('focus');
    }
  } else if (current_elem) ae = current_elem;

  if (key === "ArrowDown" && resultsAvailable && inbox) {
    e.preventDefault();

    if (ae == sInput) {
      // if the currently focused element is the search input, focus the <a> of first <li>
      activeToggle(resList.firstChild.lastChild);
    } else if (ae.parentElement == last) {// if the currently focused element's parent is last, do nothing
    } else {
      // otherwise select the next search result
      activeToggle(ae.parentElement.nextSibling.lastChild);
    }
  } else if (key === "ArrowUp" && resultsAvailable && inbox) {
    e.preventDefault();

    if (ae == sInput) {// if the currently focused element is input box, do nothing
    } else if (ae.parentElement == first) {
      // if the currently focused element is first item, go to input box
      activeToggle(sInput);
    } else {
      // otherwise select the previous search result
      activeToggle(ae.parentElement.previousSibling.lastChild);
    }
  } else if (key === "ArrowRight" && resultsAvailable && inbox) {
    ae.click(); // click on active link
  } else if (key === "Escape") {
    reset();
  }
};