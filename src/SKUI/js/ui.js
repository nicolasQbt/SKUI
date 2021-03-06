/*******************************************************************************
 *
 * module UI
 *
 ******************************************************************************/


var UI = function() {
  return {

    KEYCODE_ENTER : 13,
    KEYCODE_ESC   : 27,

    MIN_IE_VERSION : 8.0,


    init : function() {
      UI.check_environment();
      Bridge.init();
      UI.add_system_hooks();
      UI.redirect_links();
      // Initialize controls. Some need some global events to function properly.
      // (?) Automate these call?
      Window.init();
      Button.init();
      RadioButton.init();
      // Disable native browser functions to make the dialog appear more native.
      UI.disable_select();
      UI.disable_context_menu();
      // Ready Event
      window.location = 'skp:SKUI_Window_Ready';
    },

    /* Ensure links are opened in the default browser. This ensures that the
     * WebDialog doesn't replace the content with the target URL.
     */
    check_environment : function() {
      // Safari don't include a version number. So we cannot test that. But most
      // likely it'll be more up to date and compatible than IE.
      var pattern = /msie\s+(\d+\.\d+)/i
      var result = pattern.exec( navigator.userAgent );
      if ( result && parseFloat(result[1]) < UI.MIN_IE_VERSION ) {
        var $warning = $('<div class="warning"/>');
        var app = navigator.appName;
        $warning.text( 'A newer version of ' + app + 'is required for SKUI to' +
          ' function properly.' );
        $warning.appendTo( $('body') );
      }
    },

    /* Ensure links are opened in the default browser. This ensures that the
     * WebDialog doesn't replace the content with the target URL.
     */
    redirect_links : function() {
      $(document).on('click', 'a[href]', function()
      {
        window.location = 'skp:SKUI_Open_URL@' + this.href;
        return false;
      } );
    },


    /* Disables text selection on elements other than input type elements where
     * it makes sense to allow selections. This mimics native windows.
     */
    disable_select : function() {
      $(document).on('mousedown selectstart', function(e) {
        return $(e.target).is('input, textarea, select, option');
      });
    },


    /* Disables the context menu with the exception for textboxes in order to
     * mimic native windows.
     */
    disable_context_menu : function() {
      $(document).on('contextmenu', function(e) {
        return $(e.target).is('input[type=text], textarea');
      });
    },


    /* Adds a platform specific class to the BODY element that can be used as a
     * hook for CSS to make platform adjustments.
     */
    add_system_hooks : function() {
      if ( Sketchup.platform() == 'PC' ) {
        $('body').addClass('platform-windows');
      } else {
        $('body').addClass('platform-osx');
      }
    },


    /* Adds a control to the window. Called from the Ruby side with a JSON
     * object describing the control.
     */
    add_control : function(properties) {
      if ( properties.type in UI ) {
        control_class = UI[properties.type];
        control_class.add( properties )
        return true;
      } else {
        alert( 'Invalid Control Type: ' + properties.type );
        return false;
      }
    },


    /* Attaches an event to the control. Used by the control classes to set up
     * the events that is relayed back to the Ruby side.
     *
     * The optional `$child` argument is used when the event is coming from a
     * child DOM element.
     */
    add_event : function( eventname, $control, $child ) {
      control = $child || $control
      control.on( eventname, function( event ) {
        var args = new Array();
        var $c = $(this);
        // Prevent events if control is disabled
        // (?) Find parent of any sub-control?
        if ( $c.hasClass('disabled') ) {
          event.stopPropagation();
          event.preventDefault();
          return false;
        }
        /*
        // http://api.jquery.com/category/events/event-object/
        switch ( eventname )
        {
        case 'click':
          args[0] = event.pageX;
          args[1] = event.pageY;
          break;
        }
        */
        // Defer some events to allow content to update.
        // (i) When IE8 is not supported longer these events might be deprecated
        //     in favour of HTML5's `input` event.
        var defer_events = [ 'copy', 'cut', 'paste' ];
        if ( $.inArray( eventname, defer_events ) ) {
          setTimeout( function() {
            Sketchup.callback( $control.attr( 'id' ), eventname, args );
          }, 0 );
        } else {
          Sketchup.callback( $control.attr( 'id' ), eventname, args );
        }
        return true;
      } );
    },


    /* Removes a control from the window. Called from the Ruby side.
     */
    remove_control : function( control ) {
      var $control = get_object(control);
      $control.remove();
      return true;
    },


    /* Updates the given control with the given JSON properties object. The
     * control argument can be either a jQuery object or a string representing
     * the ID of the DOM element.
     */
    update_properties : function( control_or_ui_id, properties ) {
      var $control = get_object( control_or_ui_id );
      if ( properties.type in UI ) {
        control_class = UI[properties.type];
        var control = new control_class( $control );
        control.update( properties );
        return true;
      } else {
        alert( 'Invalid Control Type: ' + properties.type );
        return false;
      }
    }


  };


  /* PRIVATE */


  /* Returns a jQuery object given a jQuery object or DOM id string.
   */
  function get_object( id_or_object ) {
    if ( $.type( id_or_object ) == 'string' ) {
      return $( '#' + id_or_object );
    }
    else {
      return id_or_object;
    }
  }

}(); // UI