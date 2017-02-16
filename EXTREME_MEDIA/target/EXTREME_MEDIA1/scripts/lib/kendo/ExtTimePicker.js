//$(function(){
//});
/*jslint nomen: true, eqeq: true */
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
        return result;
    }

    function _isValidTime(value) {
        return !kendo.parseDate(value) ? false : true;
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
    
    var ExtTimePicker = kendo.ui.TimePicker.extend({
        // / <summary>
        // / Se extiende la funcionalidad del TimePicker
        // / </summary>
        options: {
            name: "ExtTimePicker"
        },
        init: function (element, options) {
            var that = this, maskedTextBox,
            	$form,
            	$validator;
            	

            /**
             * Se extiende TimePicker
             */
            kendo.ui.TimePicker.fn.init.call(that, element, options);
            $(element).data("kendoTimePicker", that);

            /**
             * Validación de fecha y mascara
             */
            $(element).kendoExtMaskedTextBox({
                mask: '00:00'
            });
            $(element).removeClass('k-textbox');
            /**
             * Se sobreescribe el metodo de validacón de las fecha en kendo para
             * que se valide usando kendoMaskedtextBox
             */
            $form = $(element).closest('form');
            if ($form) {
                $validator = $form.data('kendoValidator');
                if ($validator) {
                    $validator.options.rules.date = function (e) {
                        maskedTextBox = e.data('kendoMaskedTextBox');
                        if (maskedTextBox) {
                            return maskedTextBox._emptyMask == e.val() ? true :
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
                if (!_isValidTime(value)) {
                    that.value('');
                    e.currentTarget.validity.valid = false;
                    e.currentTarget.validity.valueMissing = true;
                }
            });
        }
    });

    kendo.ui.plugin(ExtTimePicker);
}(window.kendo.jQuery, window.kendo));