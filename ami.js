'use strict';


try {
    var request = require('request');
    let db = require('./db'),
        asterisk = require('./config'),
        fs = require('fs'),
        logFile = "/var/log/agentLog/agent.log";
    const net = require('net');
    const amiUtils = require('asterisk-ami-event-utils');
    const AmiEventsStream = require('asterisk-ami-events-stream');
    const {
        config
    } = require('process');
    const eventsStream = new AmiEventsStream();



    const amiSocket = net.connect({
        port: asterisk.manager.port
    }, () => {
        console.log('connected to asterisk ami!');
        amiSocket.write(amiUtils.fromObject({
            Action: 'login',
            Username: asterisk.manager.user,
            Secret: asterisk.manager.password,
            Events: 'on'
        }));
        amiSocket.pipe(eventsStream);
    });

    amiSocket
        .on('end', () => {
            amiSocket.unpipe(eventsStream);
            console.log('disconnected from asterisk ami');
        })
        .on('error', error => {
            console.log(error);
            amiSocket.unpipe(eventsStream);
        });

    eventsStream
        .on('amiEvent', async event => {
            console.log(event);
            var data = JSON.parse(JSON.stringify(event));
            if (data.Event == "PeerStatus" && data.PeerStatus == "Unregistered") {
                var agent = data.Peer.substring(data.Peer.indexOf('/') + 1, data.Peer.length);
                var name = await db.CheckAgent(agent);
                if (name != 0) {
                    
                    var timestamp = Math.floor(Date.now() / 1000)
                    console.log(timestamp)
                    var msg = `<?xml version="1.0" encoding="ISO-8859-1"?><monit id="77778c3f64873945074c57402e27861f" incarnation="${timestamp}" version="5.25.1"><server><uptime>0</uptime><poll>120</poll><startdelay>0</startdelay><localhostname>Asterisk</localhostname><controlfile>/etc/monit/monitrc</controlfile><httpd><address>192.168.1.130</address><port>2812</port><ssl>0</ssl></httpd></server><platform><name>Linux</name><release>4.18.0-16-generic</release><version>#Debian</version><machine>x86_64</machine><cpu>4</cpu><memory>8024196</memory><swap>0</swap></platform><services><service name="agent.log"><type>2</type><collected_sec>${timestamp}</collected_sec><collected_usec>762834</collected_usec><status>0</status><status_hint>0</status_hint><monitor>2</monitor><monitormode>0</monitormode><onreboot>0</onreboot><pendingaction>0</pendingaction></service><service name="Debian"><type>5</type><collected_sec>${timestamp}</collected_sec><collected_usec>767668</collected_usec><status>0</status><status_hint>0</status_hint><monitor>2</monitor><monitormode>0</monitormode><onreboot>0</onreboot><pendingaction>0</pendingaction></service></services><servicegroups></servicegroups><event><collected_sec>${timestamp}</collected_sec><collected_usec>772762</collected_usec><service>Monit</service><type>5</type><id>65536</id><state>2</state><action>6</action><message><![CDATA[Agent ${agent} Unregistered]]></message></event></monit>`;
                    request.post({
                            url: "http://192.168.1.130:8080/collector",
                            method: "POST",
                            headers: {
                                'Content-Type': 'text/xml',
                                'authorization': 'Basic bW9uaXQ6bW9uaXQ=',
                            },
                            body: msg
                        },
                        function (error, response, body) {
                            console.log(response.statusCode);
                            console.log(body);
                            console.log(error);
                        });
                  
                }
            }

        })
} catch (e) {
    console.log(e);
}
