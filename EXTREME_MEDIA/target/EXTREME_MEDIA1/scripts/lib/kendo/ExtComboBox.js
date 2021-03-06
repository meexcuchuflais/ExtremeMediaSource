/*jslint nomen: true */
(function (angular, kendo, $) {
    'use strict';
    
    function getComboBoxModelValue(comboBox) {
        var comboBoxId = comboBox.wrapper.context.id,
            model = angular.element($("#" + comboBoxId)).attr("ng-model"),
            qvTemplate,
            qvIndex,
            dotIndex,
            qvId,
            grid,
            rowData,
            attribute;
        if (model) { //si es un combo de cabecera
            return eval("angular.element($('#" + comboBoxId + "')).scope()." + model);
        } else { //si es un combo de grilla
            qvTemplate = $("#" + comboBoxId).attr("k-template");
            if (qvTemplate) {
                qvIndex = qvTemplate.indexOf("QV_");
                dotIndex = qvTemplate.indexOf(".column");
                qvId = qvTemplate.substring(qvIndex, dotIndex);
                grid = angular.element($("#" + qvId)).data("kendoExtGrid");
                if (grid) {
                    rowData = grid.dataItem($("#" + comboBoxId).closest("tr"));
                    if (rowData) {
                        attribute = $("#" + comboBoxId).attr("name");
                        return rowData[attribute];
                    }
                }
            }
        }
    }
    
    function setComboBoxModelValue(comboBox, value) {
        var comboBoxId = comboBox.wrapper.context.id,
            model = angular.element($("#" + comboBoxId)).attr("ng-model"),
            qvTemplate,
            qvIndex,
            dotIndex,
            qvId,
            grid,
            rowData,
            attribute;
        if (model) { //si es un combo de cabecera
            if (getComboBoxModelValue(comboBox) !== value) {
                if (value !== null) {
                    if (comboBox.dataSource.data().length === 0 || typeof comboBox.dataSource.data()[0][comboBox.options.dataValueField] === 'string') {
                        eval("angular.element($('#" + comboBoxId + "')).scope()." + model + "='" + value + "'");
                    } else {
                        value = Number(value);
                        eval("angular.element($('#" + comboBoxId + "')).scope()." + model + "=value");
                    }
                    if (angular.isUndefined(comboBox.options.cascadeFrom) || comboBox.options.cascadeFrom === "") {
                        comboBox.refresh();
                    }
                } else {
                    eval("angular.element($('#" + comboBoxId + "')).scope()." + model + "=null");
                }
            }
        } else { //si es un combo de grilla
            qvTemplate = $("#" + comboBoxId).attr("k-template");
            if (qvTemplate) {
                qvIndex = qvTemplate.indexOf("QV_");
                dotIndex = qvTemplate.indexOf(".column");
                qvId = qvTemplate.substring(qvIndex, dotIndex);
                grid = angular.element($("#" + qvId)).data("kendoExtGrid");
                if (grid) {
                    rowData = grid.dataItem($("#" + comboBoxId).closest("tr"));
                    if (rowData) {
                        attribute = $("#" + comboBoxId).attr("name");
                        if (value !== null) {
                            if (comboBox.dataSource.data().length === 0 || 
								typeof comboBox.dataSource.data()[0][comboBox.options.dataValueField] === 'string') {
                                rowData[attribute] = value;
                            } else {
                                value = Number(value);
                                rowData[attribute] = value;
                            }
                            comboBox.refresh();
                        } else {
                            rowData[attribute] = null;
                        }
                    }
                }
            }
        }
    }
    
    function onBlurHandler(comboBox) {
        if (comboBox.selectedIndex === -1) { //si no selecciono un valor
            if (comboBox.options.index === 0) { //si no tiene opcion en blanco
                if (comboBox.dataSource.data().length > 0) {
                    comboBox.text(comboBox.dataSource.data()[0].value);
                    setComboBoxModelValue(comboBox, comboBox.dataSource.data()[0][comboBox.options.dataValueField]);
                    comboBox.input.focus();
                } else {
                    comboBox.text('');
                    setComboBoxModelValue(comboBox, null);
                    comboBox.refresh();
                    //comboBox._selectItem();
                }
            } else { //si tiene seleccion en blanco
            	var valueCombo = comboBox.value();
            	if (angular.isDefined(valueCombo) && valueCombo != null && valueCombo!=='') {
                    comboBox.input.focus();
                    comboBox._selectItem();
                }
                //((getComboBoxModelValue(comboBox))||(getComboBoxModelValue(comboBox)==="")){
                comboBox.text('');
                setComboBoxModelValue(comboBox, null);
                comboBox.refresh();
                //Para poder aplicar los estilos para combos obligatorios
                var idCombo = comboBox.element.attr("id"),
                	formValidator = $("#validator").data("kendoValidator");
                if (formValidator !== null && !formValidator.validateInput($("#"+idCombo))) {
                    formValidator.hideMessages();
                }
            }
        }
    }

    var ExtComboBox = kendo.ui.ComboBox.extend({
        /// <summary>
        /// Se extiende la funcionalidad del ComboBox
        /// </summary>
        options: {
            name: "ExtComboBox"
        },
        init: function (element, options) {
            var that = this;
            /**
             * Se extiende ComboBox
             */
            kendo.ui.ComboBox.fn.init.call(that, element, options);
            //$(element).data("kendoExtComboBox", that);
            /**
             * Si no se ha seleccionado nada y se ingreso algun caracter se borra
             */

            $(element).on('blur', function (e) {
                onBlurHandler(that);
            });
        },
        select: function (li) {
            var that = this,
                comboBoxId = "",
                viewState;
            if (that.$angular_scope.vc !== undefined) {
                viewState = that.$angular_scope.vc.viewState;
                if (that.options.index === 0) {
                    comboBoxId = that.wrapper.context.id;
                    if (angular.isUndefined(that.options.loaded) && angular.isDefined(viewState[comboBoxId]) && angular.isDefined(viewState[comboBoxId].changeFlag)) {
                        viewState[comboBoxId].changeFlag = false;
                    }
                }
                if (li === undefined) {
                    return that.selectedIndex;
                } else {
                    that._select(li);
                    that._triggerCascade();
                    that._old = that._accessor();
                    that._oldIndex = that.selectedIndex;
                }
                if (that.options.index === 0) {
                    comboBoxId = that.wrapper.context.id;
                    if (angular.isUndefined(that.options.loaded) && angular.isDefined(viewState[comboBoxId]) && angular.isDefined(viewState[comboBoxId].changeFlag)) {
                        setTimeout(function () {
                            viewState[comboBoxId].changeFlag = true;
                        }, 200);
                        that.options.loaded = true;
                    }
                }
            }
        },

        _inputFocusout: function () {
            var that = this, idx;
            setTimeout(function () {
	            that._inputWrapper.removeClass('k-state-focused');
	            clearTimeout(that._typing);
	            that._typing = null;
				if (that.options.text !== that.input.val()) {
	                that.text(that.text());
				}
	            that._placeholder();
	            idx = that._index(that.value());
	            if (idx === -1) {
	                onBlurHandler(that);
	            } else {
	                that._blur();
	                that.element.blur();
	            }
            }, 200);
        },

        enable: function (enable) {
            if (enable === undefined) {
                enable = true;
            }
            var scope,
                combobox = $(this.element),
                injector = angular.element(document).injector(),
                options = this.options,
                cascade = options.cascadeFrom,
                getter,
                $parse,
                disable = !enable,
                comboBoxId = this.wrapper.context.id,
                viewState = this.$angular_scope.vc.viewState,
                that = this,
                parentWidget,
                parentValue,
                elementValue,
                disableValue,
				readOnlyValue = false,
				inputComboBox;
            if (angular.isDefined(cascade) && cascade !== "") { //si es dependiente
                parentWidget = $("#" + cascade).data("kendoExtComboBox");
                scope = angular.element(combobox).scope();
                $parse = injector.get('$parse');
                parentValue = getComboBoxModelValue(parentWidget);
                elementValue = getComboBoxModelValue(that);
                if (parentWidget.selectedIndex !== -1) { //si selecciono un valor en el padre
                    if (angular.isDefined(scope)) {
                        getter = $parse(combobox.attr('ng-disabled'));
                        disableValue = getter(scope);
                        if (disableValue) {
                            disable = disableValue;
                        }
                        inputComboBox = combobox.data("kendoExtComboBox").input;
						if(angular.isDefined(inputComboBox[0]) && inputComboBox[0].readOnly){
							readOnlyValue = true;
						}
                    }
                    if (this.options.index === 0) {
                        if (angular.isDefined(viewState[comboBoxId]) &&
                                angular.isDefined(viewState[comboBoxId].changeFlag)) {
                            viewState[comboBoxId].changeFlag = false;
                        }
						var elementsData = this.dataSource.data();
						var exists = false;
						var indexSelected = 0;
                        if (elementsData.length > 0) {							
							if((this.select() >0 && this.select() < elementsData.length)){
								setComboBoxModelValue(this, elementsData[this.select()][this.options.dataValueField]);
								this.text(elementsData[this.select()][this.options.dataTextField]);
							}else{
								$.each(elementsData, function (index, value) {
									if (value[that.options.dataValueField] == that._selectedValue) {
										exists = true;
										indexSelected = index;
										return;
									}
								});
								if(exists){
									setComboBoxModelValue(this, elementsData[indexSelected][this.options.dataValueField]);
									this.text(this.dataSource.data()[indexSelected][this.options.dataTextField]);
								}else{
									setComboBoxModelValue(this, elementsData[0][this.options.dataValueField]);
									this.text(this.dataSource.data()[0][this.options.dataTextField]);
								}
							}                            
							
                        }
                    }else if (parentWidget.value() === getComboBoxModelValue(parentWidget)) {
                        if (angular.isDefined(viewState[comboBoxId]) &&
                                angular.isDefined(viewState[comboBoxId].changeFlag)) {
                            viewState[comboBoxId].changeFlag = false;
                        }
                        if (angular.isDefined(elementValue) && elementValue != null) {
                            setComboBoxModelValue(this, elementValue);
                        } else {
                            setComboBoxModelValue(this, null);
                        }
                    } 
                } else {
                    if (angular.isDefined(viewState[comboBoxId]) &&
                            angular.isDefined(viewState[comboBoxId].changeFlag)) {
                        viewState[comboBoxId].changeFlag = false;
                    }
                    disable = true;
                    if (angular.isDefined(parentWidget.dataItem()) || parentValue === null) {
                        this.text('');
                        setComboBoxModelValue(this, null);
                    }
                }
            }
            this._editable({
                readonly: false,
                disable: disable
            });
            if(readOnlyValue && angular.isDefined(inputComboBox)){
				inputComboBox[0].readOnly=true;
			}
            setTimeout(function () {
                if (angular.isDefined(viewState[comboBoxId]) &&
                        angular.isDefined(viewState[comboBoxId].changeFlag)) {
                    viewState[comboBoxId].changeFlag = true;
                }
            }, 200);

        }
    });
    kendo.ui.plugin(ExtComboBox);
}(window.angular, window.kendo, window.kendo.jQuery));