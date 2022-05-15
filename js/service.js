API_URL = "http://localhost:8080/adspin_backend_mock/";
TOKEN_ENDPOINT = "session_token.php";
FORM_ENDPOINT = "form_consumption.php";
AD_LOAD_ENDPINT = "dummy_ads.php";
FEEDBACK_ENDPOINT = "form_consumption.php";

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
		this.get_session_token();
	},

	methods:
	{
		get_session_token()
		{
			axios
			   .get(API_URL + TOKEN_ENDPOINT)
			   .then(response =>
			   {
				   this.form_data.session_token = response.data.session_token;
			   })
			   .catch(error => console.log(error))

			// this.form_data.session_token =  generate_token();
		},
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
		async post_form()
		{
			console.log("posting the form from the user");
			const response = await axios.post(API_URL + FORM_ENDPOINT, this.form_data);
			console.log("API response:")
			console.log(response.data);
			return new Promise(resolve => resolve('r'));
		},
		async ad_form_submit(form)
		{
			form.classList.add( 'was-validated' );
			if ( form.checkValidity( ) )
			{
				await this.post_form();
				// this.ads = []; // clear the listing
				this.update_listing(); // load ads
				window.location.hash = '/listing'; // redirect
			}
		},
		update_listing()
		{
			data = { session_token: this.form_data.session_token };
			axios
			   .post(API_URL + AD_LOAD_ENDPINT, data)
			   .then(response =>
			   {
				   	console.log(response.data);
				    this.ads.push(response.data);
			   })
			   .catch(error => console.log(error))
		},
		lazy_load_ads() // function called by the observer
		{
			// enable lazy loading only after first form post
			if(this.ads !== []) this.update_listing(); // load ads
		},
		send_feedback(ad)
		{
			data =
			{
				"session_token" : this.form_data.session_token,
				"ad_id" : ad.id,
				"liked" : ad.liked
			}
			axios
			   .post(API_URL + FEEDBACK_ENDPOINT, data)
			   .catch(error => console.log(error))
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
