var latest_tap;
var previous_tap_target;

window.addEventListener("load", function()
{
    like_buttons = document.getElementsByClassName('like-button');

    for (const like_button of like_buttons)
    {
        like_button.addEventListener("click", function()
        {
            toggle_like(like_button);
        });

        like_button.previousElementSibling.addEventListener("touchend", function(event) { doubletap(event, like_button) });
    }

});


function doubletap(event, like_button)
{
    var now = new Date().getTime();
    var time_delta = now - latest_tap;

    if((time_delta < 600) && time_delta > 100)
    {
        // double tap
        if(event.target === previous_tap_target)
        {
            event.preventDefault();
            toggle_like(like_button);
            latest_tap -= 600; // prevent from retriggering the event
        }
    }
    else
    {
        // too little or much time to be a double tap
        latest_tap = new Date().getTime();
    }
    previous_tap_target = event.target;
}


function toggle_like(like_button)
{
    liked = !(like_button.getAttribute("liked") === "true");
    like_button.setAttribute("liked", liked);
    like_button.classList.toggle("glyphicon-heart-contour");
    like_button.classList.toggle("glyphicon-heart-fill");

    send_feedback(like_button.getAttribute("ad_id"), liked);
}

function send_feedback(id, state)
{
    console.log("the user " + SESSION_TOKEN + " " + (state ? "liked" : "disliked") + " the ad with id = " + id);
    // alert("the user " + (state ? "liked" : "disliked") + " the ad with id = " + id);
    // TODO: a request to django containing ad id and state (bool indicating whether i was liked)
}
