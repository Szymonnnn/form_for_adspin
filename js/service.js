var rand = function()
{
	return Math.random().toString(36).substr(2); // remove `0.`
};

var generate_token = function()
{
	return rand() + rand()
};

const TABS =
{
	 form: () => console.log("form"),
	 listing: () => console.log("listing")
}

function dummy_ads_row()
{
	ads = []

	for (var i = 0; i < 12; i++)
	{
		ad =
		{
			"id": generate_token(),
			"img_url": "img/ad_sq.png",
			"liked": false
		};

		ads.push(ad);
	}

	return ads;
}

Vue.createApp(
{
	data() {
  	return {
		active_tab: 'form',
		form_data:
		{
			session_token: '',
			name_of_company: '',
			key_features: '',
			description: '',
		},
		ads: [],
		latest_tap_time: 0,
		previous_tap_target: 0,

		navbar_class_array: ['collapse'],
      	navbar_style_object: {},
		ad_input_form: ''
	}
	},
	mounted()
	{
		window.addEventListener('hashchange', this.onHashChange)
		this.onHashChange()
		// get a session token from the backend
		this.form_data.session_token = generate_token();

		this.ad_input_form = document.getElementById('ad_input_form');
		this.ad_input_form.addEventListener( 'submit', function ( event )
	    {
	        event.preventDefault( )
	        event.stopPropagation( );
	  	}, false );
	},

	methods:
	{
		toggle_navbar_collapse(ref)
		{
	        let show = this.navbar_class_array.indexOf('show') > -1 ? false : 'show'
	        this.navbar_class_array = ['collapsing']
	        setTimeout(() =>
			{
	            if (show)
				{
	                let height = this.$refs[ref].firstChild.clientHeight + 'px';
	                this.navbar_style_object = { height }
	            }
	            else this.navbar_style_object = {}
	        }, 10)
	        setTimeout(() => { this.navbar_class_array = ['collapse', show] }, 340)
    	},
		onHashChange()
		{
			var active_tab = window.location.hash.replace(/#\/?/, '');
			if (TABS[active_tab])
			{ this.active_tab = active_tab }
			else
			{
				window.location.hash = '';
				this.active_tab = 'form';
			}
		},
		post_form()
		{
			// post form
			console.log("posting the form from the user");
			console.log(this.form_data);
		},
		generate_button_click()
		{
			this.ad_input_form.classList.add( 'was-validated' );
			if ( this.ad_input_form.checkValidity( ) )
			{
				this.post_form();
				window.location.hash = '/listing'; // redirect
				// this.ads = []; // clear the listing
				this.update_listing(); // load ads
			}
		},
		update_listing()
		{
			// TODO: replace dummy_ads_row() with a real (ascync) request
			console.log("making an ad load request from the user " + this.form_data.session_token);
			this.ads.push(dummy_ads_row(), dummy_ads_row());
			console.log(this.ads);
		},
		lazy_load_ads() // function called by the observer
		{
			// enable lazy loading only after first form post
			if(this.ads !== [])
				this.update_listing(); // load ads
		},
		send_feedback(ad)
		{
			console.log("the user " + this.form_data.session_token + " " + (ad.liked ? "liked" : "disliked") + " the ad with id = " + ad.id);
		    // alert("the user " + (state ? "liked" : "disliked") + " the ad with id = " + id);
		    // TODO: a request to django containing ad id and state (bool indicating whether i was liked)
		},
		ad_liked_toggle(ad)
		{
			ad.liked = !ad.liked;
			this.send_feedback(ad);
		},
		ad_touch_service(ad, event)
		{
			var now = new Date().getTime();
		    var time_delta = now - this.latest_tap_time;

		    if((time_delta < 600) && time_delta > 100)
		    {
		        // double tap
		        if(ad.id === this.previous_tap_target)
		        {
		            event.preventDefault();
					this.ad_liked_toggle(ad);
		            this.latest_tap_time -= 600; // prevent from retriggering the event
		        }
		    }
		    else
		    {
		        // too little or much time to be a double tap
		        this.latest_tap_time = new Date().getTime();
		    }
		    this.previous_tap_target = ad.id;
		},
	}

}).mount('#app')
