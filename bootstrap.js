const {utils: Cu, classes: Cc, interfaces: Ci, manager: Cm, results: Cr, Constructor: CC} = Components;

const self = {
	name: 'FindWindow ShowWindow',
	id: 'FindWindow-ShowWindow@jetpack',
	path: {
		chrome: 'chrome://findwindow-showwindow/content/',
		locale: 'chrome://findwindow-showwindow/locale/',
	},
	aData: 0,
};

Cu.import('resource://gre/modules/Services.jsm');
Cu.import('resource://gre/modules/devtools/Console.jsm');
Cu.import('resource://gre/modules/XPCOMUtils.jsm');

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const SCHEME = 'fwsw';
const FWSW_URI = Services.io.newURI(self.path.chrome + 'index.xhtml', null, null);

const nsIURI = CC('@mozilla.org/network/simple-uri;1', 'nsIURI');

function FWSWProtocolHandler () {}
FWSWProtocolHandler.prototype = Object.freeze({
  classDescription: 'FindWindow ShowWindow Protocol Handler',
  contractID: '@mozilla.org/network/protocol;1?name=' + SCHEME,
  classID: Components.ID('{81de0d70-c689-11e4-8830-0800200c9a66}'),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler]),

  // nsIProtocolHandler
  scheme: SCHEME,
  defaultPort: -1, // No default port.

  // nsIProtocolHandler
  allowPort: function(port, scheme) {
    // This protocol handler does not support ports.
    return false;
  },

  // nsIProtocolHandler
  // Our protocol handler does not support authentication,
  // but it is OK to be loaded from any web-page, not just privileged pages""
  protocolFlags: Ci.nsIProtocolHandler.URI_NOAUTH |
                 Ci.nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

  // nsIProtocolHandler
  newURI: function(aSpec, aOriginCharset, aBaseURI) {
    // Nothing special here, actually. We were asked to create a new URI.
	
	//console.log('nothing speical here:', aSpec);
	
    // If there is a base-URI, this means that the browser tries to resolve
    // a dependent resource (an image, script) or the user clicked on a relative link.
    // In this case we cannot really return another "ddg" URI, but need to return
    // the proper https URI.
    if (aBaseURI && aBaseURI.scheme == SCHEME) {
      return Services.io.newURI(aSpec, aOriginCharset, FWSW_URI);
    }

    // We don't care about the charset, so just ignore that
    // (we support what nsIURI supports).
    let rv = new nsIURI();
    rv.spec = aSpec;
    return rv;
  },

  // nsIProtocolHandler
  newChannel: function(aURI) {
    // We were asked to open a new channel.
    // We could implement an entirely custom channel that supports
    // (most of) nsIChannel. But that is tremendous work and outside
    // of the scope of this basic example (which is about protocol handlers and
    // not channels).
    // Or we can just return any other channel we can create.
    // Since we're going to implement the "ddg:" protocol, lets just open a
    // regular https channel to duckduckgo.com, use the URI as the search term
    // and return that channel.
    let spec = FWSW_URI.spec;//.replace('%s', aURI.path);
    let channel = Services.io.newChannel(spec, aURI.originCharset, null);

	console.log('spec:', spec);
	console.log('orig aURI:', aURI.spec);
	
    // Setting .originalURI will not only let other code know where this
    // originally came from, but the UI will actually show that .originalURI.
    channel.originalURI = aURI;

    return channel;
  }
});

function Factory(component) {
	Cm.QueryInterface(Ci.nsIComponentRegistrar);
	
  this.createInstance = function(outer, iid) {
    if (outer) {
      throw Cr.NS_ERROR_NO_AGGREGATION;
    }
    return new component();
  };
  this.register = function() {
    Cm.registerFactory(component.prototype.classID,
                       component.prototype.classDescription,
                       component.prototype.contractID,
                       this);
  };
  this.unregister = function() {
    Cm.unregisterFactory(component.prototype.classID, this);
  }
  Object.freeze(this);
  
  this.register();
}
var factory;

// start bootstrap hook ins
function startup(aData, aReason) {
	console.log('startup reason = ', aReason);
	
	self.aData = aData; //must go first, because functions in loadIntoWindow use self.aData
	factory = new Factory(FWSWProtocolHandler);
	
}

function shutdown(aData, aReason) {
	console.log('shutdown reason = ', aReason);
	if (aReason == APP_SHUTDOWN) return;

	factory.unregister();
}

function install(aData, aReason) {
	//must have arguments of aData and aReason otherwise the uninstall function doesn't trigger
}

function uninstall(aData, aReason) {
	
}
// end bootstrap hook ins