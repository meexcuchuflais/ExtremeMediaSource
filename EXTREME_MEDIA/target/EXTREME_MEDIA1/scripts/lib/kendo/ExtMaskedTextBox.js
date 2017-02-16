(function ($, kendo) {
    var ExtMaskedTextBox = kendo.ui.MaskedTextBox.extend({
        /// <summary>
        /// Se extiende la funcionalidad del MaskedTextBox
        /// </summary>

        options: {
            name: "ExtMaskedTextBox"
        },

        init: function (element, options) {
            var that = this;
			
			/**
			* Se extiende MaskedTextBox
			*/
            kendo.ui.MaskedTextBox.fn.init.call(that, element, options);
            $(element).data("kendoMaskedTextBox", that);
			/** 
			* Al hacer click se posiciona el cursor en el primer caracter de mascara
			* que encuentra
			*/
			$(element).on('click', function(e){

				if (that.value() == '' || (that._emptyMask == that.value())){
					that._positionateCursor(this, 0);
					
				} else{
					var indexOf = that.value().indexOf(that.options.promptChar);
					if (indexOf != -1){
						that._positionateCursor(this, indexOf);
					}
				}
			});
			
        },
		
		/**
		* Posiciona el cursor seg�n su indice en una caja de texto
		*/
		_positionateCursor: function(element, position){
			
			if (element.createTextRange) {
				var part = element.createTextRange();
				part.move("character", position);
				part.select();
				
			}else if (element.setSelectionRange){
				element.setSelectionRange(position, position);
			}
			element.focus();
		}
    });
	
    kendo.ui.plugin(ExtMaskedTextBox);
})(window.kendo.jQuery, window.kendo);