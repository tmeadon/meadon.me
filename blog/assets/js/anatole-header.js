// initialize default value
function getTheme() {
    return localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
}

// add chroma css
function setChromaTheme(theme) {
    var lightCssRegex = /^.*syntax\-github\..*css$/;
    var darkCssRegex = /^.*syntax\-native\..*css$/;
    var links = document.getElementsByTagName('link');

    for (var i = 0; i < links.length; i++) {
        if (lightCssRegex.test(links[i].href)) {
            if (theme == 'light') {
                links[i].disabled = false;
            } else {
                links[i].disabled = true;
            }
        }
        if (darkCssRegex.test(links[i].href)) {
            if (theme == 'dark') {
                links[i].disabled = false;
            } else {
                links[i].disabled = true;
            }
        }
    }
}

function setTheme(style) {
    document.documentElement.setAttribute('data-theme', style);
    setChromaTheme(style)
    localStorage.setItem('theme', style);
}

function init() {
    // initialize default value
    var theme = getTheme();

    // check if a prefered color theme is set for users that have never been to our site
    const userPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (theme === null) {
        if (userPrefersDark) {
            setTheme('dark');
        } else if (!document.documentElement.getAttribute('data-theme')) {
            setTheme('light');
        } else {
            setTheme(document.documentElement.getAttribute('data-theme'));
        }
    } else {
        // load a stored theme
        if (theme == 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }
}

// switch themes
function switchTheme(e) {
    var theme = getTheme();
    if (theme == 'light') {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    var themeSwitcher = document.querySelector('.theme-switch');
    themeSwitcher.addEventListener('click', switchTheme, false);
}, false);

document.addEventListener("DOMContentLoaded", function () {
// Get all "navbar-burger" elements
    var $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll(".navbar-burger"), 0);
// Check if there are any navbar burgers
    if ($navbarBurgers.length > 0) {
        // Add a click event on each of them
        $navbarBurgers.forEach(function ($el) {
            $el.addEventListener("click", function () {
                var target = $el.dataset.target;
                var $target = document.getElementById(target);
                $el.classList.toggle("is-active");
                $target.classList.toggle("is-active");
            });
        });
    }
});

init();
