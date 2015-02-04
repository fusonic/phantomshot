// This script will be injected into the login page and executed sandboxes within
// the page. It should fill and send the login form. This is just sample code for
// a page that has jQuery already loaded.

$("#name").val("admin");
$("#password").val("admin");
$("#login-form").submit();
