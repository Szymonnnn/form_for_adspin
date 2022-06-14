API_URL = "https://adspin.herokuapp.com/playground/";
TOKEN_ENDPOINT = "sessionToken/";
FORM_ENDPOINT = "submit/";
SIGNIN_ENDPOINT = "signIn/";
SIGNOUT_ENDPOINT = "signOut/";
FORGOT_PASSWORD_ENDPOINT = "forgotPassword";
PASSWORD_RECOVERY_ENDPOINT = "passwordRecovery";
SIGNUP_ENDPOINT = "signUp/";
AD_LOAD_ENDPINT = "getNewImages/";
LIKED_AD_ENDPINT = "getLikedImages/";
FEEDBACK_ENDPOINT = "liked/";

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
	 listing: () => console.log("listing"),
	 liked: () => console.log("liked"),
	 login: () => console.log("login"),
	 sign_up: () => console.log("sign_up"),
	 password_recovery: () => console.log("password_recovery"),
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
		session_token: '',
		ad_form_data:
		{
			session_token: '',
			name_of_company: '',
			key_features: '',
			description: '',
		},
		sign_in_form_data:
		{
			session_token: '',
			email: '',
			password: '',
			remember_me: true,
		},
		sign_up_form_data:
		{
			session_token: '',
			first_name: '',
			last_name: '',
			email: '',
			password: ''
		},
		password_recovery_form:
		{
			session_token: '',
			email: '',
			password: '',
			verification_code: ''
		},
		ads: [],
		latest_tap_time: 0,
		previous_tap_target: 0,
		navbar_class_array: ['collapse'],
      	navbar_style_object: {},
		ad_input_form: '',
		was_form_posted: false,
		session_restored: false,
		ad_loading_spinner: '',
		ll_observer: '',
		liked_ads: [],
		user_signed_in: false
	}
	},
	mounted()
	{
		window.addEventListener('hashchange', this.on_hash_change)

		axios.defaults.withCredentials = true;
		axios.defaults.xsrfCookieName = 'csrftoken';
		axios.defaults.xsrfHeaderName = 'X-CSRFToken';

		this.get_session_token();
		this.ad_loading_spinner = document.getElementById('ad_loading_spinner');
		this.on_hash_change();

	    let options =
	    {
	        // root: document.querySelector('#scrollArea'),
	        // rootMargin: '0px',
	        // threshold: 1 / 10
	    };
		this.ll_observer = new IntersectionObserver(this.ll_callback, options);
	},
	computed:
	{
		computed_liked_ads()
		{
			return this.ads.reduce((acc, ads_row) => acc.concat(Object.values(ads_row).filter((ad) => ad.liked)), []);
		}
	},
	methods:
	{
		add_observer_targets()
		{
			observer_targets = document.querySelectorAll('.observed_target');
			observer_targets.forEach(target => this.ll_observer.observe(target));
		},
		ll_callback (entries, observer)
		{
		    entries.forEach(entry =>
		    {
		        if (entry.isIntersecting)
				{
					observer.unobserve(entry.target);
					entry.target.classList.remove('observed_target');
					this.lazy_load_ads();
				}
		    });
		},

		get_session_token()
		{
			axios
			   .get(API_URL + TOKEN_ENDPOINT)
			   .then(response =>
			   {
				   this.session_token = response.data.session_token;
				   axios.defaults.headers.post['X-CSRFToken'] = response.data.csrf_token;
				   this.session_restored = response.data.session_restored;
			   })
			   .catch(error => console.log(error))

			// this.session_token =  generate_token();
		},
		toggle_navbar_collapse(ref)
		{
	        let show = this.navbar_class_array.indexOf('show') > -1 ? false : 'show'
	        this.navbar_class_array = ['collapsing']
	        setTimeout(() =>
			{
	            if (show)
				{
					let height1 = this.$refs[ref].firstChild.clientHeight;
					let height2 = this.$refs[ref].firstChild.nextSibling.clientHeight;
					console.log(height1);
					console.log(height2);
	                let height = ( height1 == height2 ? height1 : height1 + height2 ) + 'px';
	                this.navbar_style_object = { height }
	            }
	            else this.navbar_style_object = {}
	        }, 10)
	        setTimeout(() => { this.navbar_class_array = ['collapse', show] }, 340)
    	},
		on_hash_change()
		{
			var active_tab = window.location.hash.replace(/#\/?/, '');
			if (TABS[active_tab])
			{
			    this.active_tab = active_tab;
			    if(active_tab === "listing") this.lazy_load_ads();
				else if(active_tab == "liked") this.get_liked_items();
			}
			else
			{
				window.location.hash = '';
				this.active_tab = 'form';
			}
		},
		async post_form()
		{
			console.log("posting the form from the user");
			this.ad_form_data.session_token = this.session_token;
			const response = await axios.post(API_URL + FORM_ENDPOINT, this.ad_form_data);
			console.log("API form response:")
			console.log(response.data);
			this.was_form_posted = true;
			return new Promise(resolve => resolve('r'));
		},
		async ad_form_submit(form)
		{
			form.classList.add( 'was-validated' );
			if ( form.checkValidity( ) )
			{
				await this.post_form();
				// this.ads = []; // clear the listing
				window.location.hash = '/listing'; // redirect
				this.update_listing(); // load ads
			}
		},
		sign_in_submit(form)
		{
			this.sign_in_form_data.session_token = this.session_token;
			axios
			   .post(API_URL + SIGNIN_ENDPOINT, this.sign_in_form_data)
			   .then(response =>
			   {
					if(response.data.sign_in_success)
					{
						this.user_signed_in = true;
						window.location.hash = '/form'; // redirect
						form.querySelector(".invalid-feedback").style.display = "none";
					}
					else if(response.data.incorrect_credentials)
					{
						console.log("login fail");
						form.querySelector(".invalid-feedback").style.display = "block";
					}
			   })
			   .catch(error => console.log(error))
		},
		sign_out()
		{
			data = { session_token: this.session_token};
			axios
			   .post(API_URL + SIGNOUT_ENDPOINT, data)
			   .then(response =>
			   {
					if(response.data.sign_out_success)
					{
	 	   				this.user_signed_in = false;
					}
					else
					{
						console.log("could not sign out");
					}
			   })
			   .catch(error => console.log(error))
		},
		forgot_password()
		{
			// setTimeout(()=>{window.location.hash = '/password_recovery'}, 10);
			this.sign_in_form_data.session_token = this.session_token;
			axios
			   .post(API_URL + FORGOT_PASSWORD_ENDPOINT, this.sign_in_form_data)
			   .then(response =>
			   {
					// email with verification code sent
					window.location.hash = '/password_recovery'; // redirect
			   })
			   .catch(error => console.log(error))
		},
		password_recovery_submit(form)
		{
			this.password_recovery_form.session_token = this.session_token;
			axios
			   .post(API_URL + PASSWORD_RECOVERY_ENDPOINT, this.password_recovery_form)
			   .then(response =>
			   {
					if(response.data.password_recovery_success)
					{
						window.location.hash = '/login'; // redirect
						form.querySelector(".invalid-feedback").style.display = "none";
					}
					else
					{
						console.log("password recovery fail");
						form.querySelector(".invalid-feedback").style.display = "block";
					}
			   })
			   .catch(error => console.log(error))
		},
		sign_up_submit(form)
		{
			this.sign_up_form_data.session_token = this.session_token;
			axios
			   .post(API_URL + SIGNUP_ENDPOINT, this.sign_up_form_data)
			   .then(response =>
			   {
					if(response.data.sign_up_success)
					{
						console.log("sign up succes");
						form.querySelector(".invalid-feedback").style.display = "none";
						window.location.hash = '/login'; // redirect
					}
					else if(response.data.email_already_in_use)
					{
						console.log("sign up fail - email already in use");
						form.querySelector(".invalid-feedback").style.display = "block";
					}
			   })
			   .catch(error => console.log(error))
		},
		update_listing()
		{
			// this.ads.push(dummy_ads_row());
			// return;

			this.ad_loading_spinner.classList.remove("invisible");
			data = { session_token: this.session_token, size: 12 };
			axios
			   .post(API_URL + AD_LOAD_ENDPINT, data)
			   .then(response =>
			   {
	   				this.ad_loading_spinner.classList.add("invisible");
				   	console.log(response.data);
				    this.ads.push(response.data);
					this.add_observer_targets();
			   })
			   .catch(error => console.log(error))
		},
		lazy_load_ads() // function called by the observer
		{
			console.log(this.session_restored);
			// enable lazy loading only after first form post or if another session was found
			if(this.was_form_posted || this.session_restored)
				this.update_listing(); // load ads
		},
		send_feedback(ad)
		{
			data =
			{
				"session_token" : this.session_token,
				"id" : ad.id,
				"liked" : ad.liked
			}
			axios
			   .post(API_URL + FEEDBACK_ENDPOINT, data)
			   .then(response =>
			   {
				   	console.log("API like response:");
				   	console.log(response.data);
			   })
			   .catch(error => console.log(error))
		},
		ad_liked_toggle(ad)
		{
			ad.liked = !ad.liked;
			this.send_feedback(ad);
		},
		get_liked_items()
		{
			if (!this.user_signed_in)
			{
				this.liked_ads = this.computed_liked_ads;
				return;
			}

			this.ad_loading_spinner.classList.remove("invisible");
			data = { session_token: this.session_token };
			axios
			   .post(API_URL + LIKED_AD_ENDPINT, data)
			   .then(response =>
			   {
	   				this.ad_loading_spinner.classList.add("invisible");
				   	console.log(response.data);
				    this.liked_ads = response.data;
			   })
			   .catch(error => console.log(error))
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
		}
	}

}).mount('#app')
