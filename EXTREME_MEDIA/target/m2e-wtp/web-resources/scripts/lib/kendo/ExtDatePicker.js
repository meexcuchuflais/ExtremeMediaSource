//$(function(){
/* Según esto kendo valida la fecha y se establece la mascara */
//kendo.culture().calendar.patterns.d = 'd-M-yyyy';
//kendo.culture().calendar['/'] = '-';
//});
/*jslint nomen: true, eqeq: true*/

(function ($, kendo) {
    'use strict';
    
    function kendoRequired(a) {
        var c = a.parents('[data-role="validator"]').first(),
            result;
        if (a.is("[type=radio]")) {
            result = (!a.is("[required]") || c.find("[name=" + a.attr("name") + "]").is(":checked"));
        } else {
            result = kendo.ui.Validator.fn.options.rules.required(a);
        }
    }

    function _isValidDate(value) {
        return !kendo.parseDate(value) ? false : true;
    }

    function _getFormatMask() {

        var separator = kendo.culture().calendar['/'],
            pattern = kendo.culture().calendar.patterns.d,
            mask = '',
            parts = pattern.split(separator),
            i;
        for (i = 0; i < parts.length; i += 1) {
            if (parts[i].length === 1) {
                //el día y mes al menos es de 2 caracteres
                parts[i] = parts[i] + parts[i];
            }
            parts[i] = parts[i].replace(/./g, "0");
        }
        mask = parts.join(separator);
        return mask;
    }

    // Helper for debug
    function showCssClasses(element) {
        var classes = {};
        $(element).each(function () {
            $($(this).attr('class').split(' ')).each(function () {
                if (this !== '') {
                    classes[this] = this;
                }
            });
        });

        return classes;
    }
    
    var ExtDatePicker = kendo.ui.DatePicker.extend({
        /// <summary>
        /// Se extiende la funcionalidad del DatePicker
        /// </summary>

        options: {
            name: "ExtDatePicker"
        },

        init: function (element, options) {
            var that = this,
                maskedTextBox,
                $form,
                $validator;

            /**
             * Se extiende DatePicker
             */
            kendo.ui.DatePicker.fn.init.call(that, element, options);
            $(element).data("kendoDatePicker", that);

            /** 
             * Validación de fecha y mascara
             */
            $(element).kendoExtMaskedTextBox({
                mask: _getFormatMask()
            });
            $(element).removeClass('k-textbox');
            //$(element).attr('placeholder', kendo.culture().calendar.patterns.d);

            /**
             * Se sobreescribe el metodo de validacón de las fecha en kendo
             * para que se valide usando kendoMaskedtextBox
             */
            $form = $(element).closest('form');
            if ($form) {
                $validator = $form.data('kendoValidator');
                if ($validator) {
                    $validator.options.rules.date = function (e) {
                        maskedTextBox = e.data('kendoMaskedTextBox');
                        if (maskedTextBox) {
                            return maskedTextBox._emptyMask === e.val() ? true :
                                    kendo.ui.Validator.fn.options.rules.date(e);
                        }
                        return kendo.ui.Validator.fn.options.rules.date(e);
                    };

                    $validator.options.rules.required = function (e) {
                        maskedTextBox = e.data('kendoMaskedTextBox');
                        if (maskedTextBox) {
                            return maskedTextBox._emptyMask == e.val() ? false :
                                    kendoRequired(e);
                        }
                        return kendoRequired(e);
                    };
                }
            }

            $(element).on('change', function (e) {
                var value = $(this).val();
                if (!_isValidDate(value)) {
                    that.value('');
                }
            });
        }
    });


    kendo.ui.plugin(ExtDatePicker);
}(window.kendo.jQuery, window.kendo));