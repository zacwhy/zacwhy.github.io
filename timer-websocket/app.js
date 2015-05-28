new Vue({

    el: "#people",

    data: {
        activeSession: null,
        people: [],
        personName: "",
        now: null,
        websocket: null
    },

    ready: function() {
        this.tick();
        setInterval(this.tick, 1000);
  
        this.websocket = new WebSocket(webSocketUrl);
  
        var base = this;
        this.websocket.onmessage = function (evt) {
            var item = JSON.parse(evt.data);
            base.addSession(item.personName, item.time);
        };
        
        this.$$.personName.focus();
    },

    computed: {
        totalSessionCount: function() {
            return this.people.reduce(function(totalSessionCount, person) {
                return totalSessionCount + person.sessions.length;
            }, 0);

            // var count = 0;

            // for (var i = 0; i < this.people.length; i++) {
            //     count += this.people[i].sessions.length;
            // }

            // return count;
        },
        totalMilliseconds: function() {
            var base = this;
            return this.people.reduce(function(totalMilliseconds, person) {
                return totalMilliseconds + base.getMilliseconds(person);
            }, 0);

            // var milliseconds = 0;

            // for (var i = 0; i < this.people.length; i++) {
            //     milliseconds += this.getMilliseconds(this.people[i]);
            // }

            // return milliseconds;
        },
        totalDuration: function() {
            return formatTime(this.totalMilliseconds);
        }
    },

    methods: {
        onSubmit: function(e) {
            e.preventDefault();

            if ( ! this.personName) return;

            this.addSession(this.personName, this.now);
            
            var message = JSON.stringify({event: "startTalk", personName: this.personName, time: this.now});
            this.websocket.send(message);

            this.personName = "";
        },
        selectPerson: function(person) {
            this.addSession(person.name, this.now);
        },
        addSession: function(personName, start) {
            var person = this.people.filter(function(person) {
                return person.name === personName;
            })[0];

            if ( ! person) {
                person = {name: personName, sessions: []};
                this.people.push(person);
            }

            if (this.activeSession) {
                this.activeSession.end = start;
            }

            this.activeSession = {start: start};
            person.sessions.push(this.activeSession);
        },
        getSessionCount: function(person) {
            return person.sessions.length;
        },
        getMilliseconds: function(person) {
            var base = this;
            return person.sessions.reduce(function(totalMilliseconds, session) {
                var milliseconds = (session.end || base.now) - session.start;
                return totalMilliseconds + milliseconds;
            }, 0);

            // var milliseconds = 0;

            // for (var i = 0; i < person.sessions.length; i++) {
            //     var session = person.sessions[i];
            //     milliseconds += (session.end || this.now) - session.start;
            // }

            // return milliseconds;
        },
        getDuration: function(person) {
            return formatTime(this.getMilliseconds(person));
        },
        tick: function() {
            this.now = Date.now();
        }
    }

});

function formatTime(milliseconds) {
    var seconds = Math.floor(milliseconds / 1000);

    var minutesInHour = 60;
    var secondsInMinute = 60;
    var secondsInHour = minutesInHour * secondsInMinute;

    var h = Math.floor(seconds / secondsInHour);
    var m = Math.floor(seconds % secondsInHour / secondsInMinute);
    var s = seconds % secondsInHour % secondsInMinute;

    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}
