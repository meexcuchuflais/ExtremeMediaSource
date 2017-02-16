/**
 * Created by dzuniga on 09/04/2015.
 */
(function ($, kendo) {
    var proxy = $.proxy,
        isPlainObject = $.isPlainObject,
        extend = $.extend,
        browser = kendo.support.browser,
        NAVCELL = ":not(.k-group-cell):not(.k-hierarchy-cell):visible",
		CLICK = "click",
		NS = ".kendoGrid",
		DATABOUND = "dataBound",
        ExtGrid;

    function leafColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (!columns[idx].columns) {
                result.push(columns[idx]);
                continue;
            }
            result = result.concat(leafColumns(columns[idx].columns));
        }

        return result;
    }
	
	function visibleLeafColumns(columns) {
        var result = [];

        for (var idx = 0; idx < columns.length; idx++) {
            if (columns[idx].hidden) {
                continue;
            }

            if (columns[idx].columns) {
                result = result.concat(visibleLeafColumns(columns[idx].columns));
            } else {
                result.push(columns[idx]);
            }
        }

        return result;
    }
	
	function isVisible(column) {
        return visibleColumns([column]).length > 0;
    }

    function visibleColumns(columns) {
        return $.grep(columns, function(column) {
            var result = !column.hidden;
            if (result && column.columns) {
                result = visibleColumns(column.columns).length > 0;
            }
            return result;
        });
    }

    function focusTable(table, direct) {
        var msie = browser.msie;
        if (direct === true) {
            table = $(table);
            var condition = true || msie && table.parent().is(".k-grid-content,.k-grid-header-wrap"),
                scrollTop, scrollLeft;
            if (condition) {
                scrollTop = table.parent().scrollTop();
                scrollLeft = table.parent().scrollLeft();
            }

            if (msie) {
                try {
                    //The setActive method does not cause the document to scroll to the active object in the current page
                    table[0].setActive();
                } catch(e) {
                    table[0].focus();
                }
            } else {
                table[0].focus(); //because preventDefault bellow, IE cannot focus the table alternative is unselectable=on
            }

            if (condition) {
                table.parent().scrollTop(scrollTop);
                table.parent().scrollLeft(scrollLeft);
            }

        } else {
            $(table).one("focusin", function(e) { e.preventDefault(); }).focus();
        }
    }

    function createEditor(column) {
        return function (container, options) {
            if (column.editor) {
                column.editor(container, options);				
				container.find('input, select, textarea, a, button, select')
					.attr('ng-disabled', true)
					.addClass('k-input')
					//.addClass('k-state-disabled')
					.removeAttr('ng-readonly')
					.removeAttr('ng-show');
				setTimeout(function () {
					container.find('input, select, textarea, a, button, select')
						.attr('disabled', 'disabled');
				}, 200);
            } else {
                var text = $('<div/>', {
                    'ng-bind': 'dataItem.' + options.field
                });
                text.appendTo(container);
            }
        };
    }
	
	function doCollapseAndDestroyCurrentDetail(grid, row, uid, detailRow) {
		var scope;
		grid.collapseRow(row);
		scope = angular.element(detailRow.find('td.k-detail-cell > div')).scope();
		detailRow.remove();
		if (angular.isDefined(scope)) {
			scope.vc.removeChildVc(uid);
			scope.$destroy();
		}
	}
	
	function collapseAndDestroyCurrentDetail(grid, model) {
		var uid, 
			row, 
			detailCell,
			detailRow, 
			scope;
		
		/* 
		 * If this grid has detailTemplate, the edit mode is not equal to 'popup', 
		 * and angular library is available, this code does the following steps:
		 * 1) It collapses current row detail.
		 * 2) It removes the html and angular scope associated to row detail.
		 */
		if (model && grid._hasDetails() && grid._editMode() !== 'popup' && angular) {
			uid = model.uid;
			row = grid.tbody.find('tr[data-uid=' + uid + ']');
			detailRow = row.find('+ tr.k-detail-row');
			if (detailRow.length > 0) {
				doCollapseAndDestroyCurrentDetail(grid, row, uid, detailRow);
			} else {
				detailRow = grid.tbody.find('tr.k-detail-row')
				if (detailRow.length > 0) {
					row = detailRow.prev('tr.k-master-row');
					if (row.length > 0) {
						uid = row.attr(kendo.attr('uid'));
						doCollapseAndDestroyCurrentDetail(grid, row, uid, detailRow);
					}
				}
			}
		}
	}
	
	function moveHierarchyCellToTheLastColumn(grid, model) {
		var uid, 
			row, 
			index;
			
		/*
		 * if this grid has detailTemplate and its edit mode is not equal to 'popup',
		 * this code finds the hierarchy column and sends it to the last column.
		 */
		if (model && grid._hasDetails() && grid._editMode() !== 'popup') {
			uid = model.uid;
			row = $('tr[data-uid=' + uid + ']');
			if (row.length > 0) {
				index = row.find('> td:last').index();
				row.find('.k-hierarchy-cell').each(function() {
					var element = $(this).siblings().eq(index - 1);
					if (element) {
						$(this).insertAfter(element);
					}
				});
			}
		}
	}

    ExtGrid = kendo.ui.Grid.extend({
        options: {
            name: "ExtGrid"
        },
        init: function (element, options) {
            var that = this,
                dataBound = options.dataBound,
                details = options.details;

            if (typeof details !== 'undefined') {
                options.dataBound = function (e) {
                    var grid = e.sender, currentTarget;
                    grid.tbody.find('> tr').each(function () {
                        if (this.oncontextmenu === null) {
                            this.oncontextmenu = function (e) {
                                currentTarget = e.currentTarget;
                                setTimeout(function () {
                                    that.showDetails(currentTarget)
                                }, 100);
                                return false;
                            };
                        }
                    });
                    if (typeof dataBound !== 'undefined' && dataBound !== null) {
                        dataBound.call(this, e);
                    }
                };
            }
            kendo.ui.Grid.fn.init.call(this, element, options);
            $(element).data("kendoGrid", that);
        },
		
		_editCancelClick: function(e) {
			kendo.ui.Grid.fn._editCancelClick.call(this, e);
			var grid = this, currentTarget;
			grid.tbody.find('> tr').each(function () {
				if (this.oncontextmenu === null) {
					this.oncontextmenu = function (e) {
						currentTarget = e.currentTarget;
						setTimeout(function () {
							grid.showDetails(currentTarget);
						}, 100);
						return false;
					}
				}
			});
			grid.options.dataBound({sender:grid})
		},
		
		_destroyDetailEditable: function () {			
			var that = this, grid = this, currentTarget;
			
            var destroy = function() {
                if (that.editable) {

                    var container = that.editView ? that.editView.element : that._editContainer;

                    if (container) {
                        container.off(CLICK + NS, "a.k-grid-cancel", that._editCancelClickHandler);
                        container.off(CLICK + NS, "a.k-grid-update", that._editUpdateClickHandler);
                    }

                    that._detachModelChange();
                    that.editable.destroy();
                    that.editable = null;
                    that._editContainer = null;
                    that._destroyEditView();
                }
            };

            if (that.editable && that._editContainer.data("kendoWindow")) {
                that._editContainer.data("kendoWindow").bind("deactivate", destroy).close();
            }
            if (that._actionSheet) {
                that._actionSheet.destroy();
                that._actionSheet = null;
            }
			
			grid.tbody.find('> tr').each(function () {
				if (this.oncontextmenu === null) {
					this.oncontextmenu = function (e) {
						currentTarget = e.currentTarget;
						setTimeout(function () {
							grid.showDetails(currentTarget)
						}, 100);
						return false;
					}
				}
			});
		},
		
		_cancelDetailRow: function() {
            var that = this,
                container = that._editContainer,
                model,
                tr;

            if (container) {
				var id = container.attr(kendo.attr("uid"));
                model = that.dataSource.getByUid(id);
				
				collapseAndDestroyCurrentDetail(that, model);

                that._destroyDetailEditable();

                that.dataSource.cancelChanges(model);

                that._displayRow(that.tbody.find("[" + kendo.attr("uid") + "=" + model.uid + "]"));
            }
        },
		
		_refreshCloseDetail: function() {
            var that = this,
                length,
                idx,
                html = "",
                data = that.dataSource.view(),
                navigatable = that.options.navigatable,
                currentIndex,
                current = $(that.current()),
                isCurrentInHeader = false,
                groups = (that.dataSource.group() || []).length,
                offsetLeft = that.content && that.content.scrollLeft(),
                colspan = groups + visibleLeafColumns(visibleColumns(that.columns)).length;            

            that._angularItems("cleanup");

            if (navigatable && (that._isActiveInTable() || (that._editContainer && that._editContainer.data("kendoWindow")))) {
                isCurrentInHeader = current.is("th");
                currentIndex = 0;
                if (isCurrentInHeader) {
                    currentIndex = that.thead.find("th:not(.k-group-cell)").index(current);
                }
            }

            that._destroyEditable();

            that._progress(false);

            that._hideResizeHandle();

            that._data = [];

            if (!that.columns.length) {
                that._autoColumns(that._firstDataItem(data[0], groups));
                colspan = groups + that.columns.length;
            }

            that._group = groups > 0 || that._group;

            if(that._group) {
                that._templates();
                that._updateCols();
                that._updateLockedCols();
                that._updateHeader(groups);
                that._group = groups > 0;
            }

            that._renderContent(data, colspan, groups);

            that._renderLockedContent(data, colspan, groups);

            that._footer();

            that._setContentHeight();

            that._setContentWidth(offsetLeft);

            if (that.lockedTable) {
                //requires manual trigger of scroll to sync both tables
                if (that.options.scrollable.virtual) {
                    that.content.find(">.k-virtual-scrollable-wrap").trigger("scroll");
                } else if (that.touchScroller) {
                    that.touchScroller.movable.trigger("change");
                } else {
                    that.content.trigger("scroll");
                }
            }

            if (currentIndex >= 0) {
                that._removeCurrent();
                if (!isCurrentInHeader) {
                    that.current(that.table.add(that.lockedTable).find(FIRSTNAVITEM).first());
                } else {
                    that.current(that.thead.find("th:not(.k-group-cell)").eq(currentIndex));
                }

                if (that._current) {
                    focusTable(that._current.closest("table")[0], true);
                }
            }

            if (that.touchScroller) {
                that.touchScroller.contentResized();
            }

            if (that.selectable) {
                that.selectable.resetTouchEvents();
            }

            that._angularItems("compile");

            that.trigger(DATABOUND);
       },
		
        _createDetailEditor: function(model) {
            var that = this,
                html = '<div ' + kendo.attr("uid") + '="' + model.uid + '" class="k-popup-edit-form' + (that._isMobile ? ' k-mobile-list' : '') + '"><div class="k-edit-form-container">',
                column,
                columnEditor,
                fields = [],
                idx,
                length,
                tmpl,
                columns = leafColumns(that.columns),
                editable = that.options.editable,
                options = isPlainObject(editable) ? editable.window : {},
                settings = extend({}, kendo.Template, that.options.templateSettings),
				container,
				details = that.options.details;

            options = options || {};


            for (idx = 0, length = columns.length; idx < length; idx++) {
                column = columns[idx];

                if (!column.command) {
                    html += '<div class="k-edit-label"><label for="' + column.field + '">' + (column.title || column.field || "") + '</label></div>';

                    if ((!model.editable || model.editable(column.field)) && column.field) {
                        columnEditor = createEditor(column);
                        fields.push({
                            field: column.field,
                            format: column.format,
                            editor: columnEditor,
                            values: column.values
                        });
                        html += '<div ' + kendo.attr("container-for") + '="' + column.field.trim() + '" class="k-edit-field"></div>';
						//html += '<div ' + kendo.attr("container-for") + '="' + column.field.trim() + '" class="k-edit-field"><input name="'+column.field.trim()+'" data-bind="value:'+ column.field.trim()+'" class="k-input k-textbox"/></div>';
                    } else {
                        var state = { storage: {}, count: 0 };

                        tmpl = kendo.template(that._cellTmpl(column, state), settings);

                        if (state.count > 0) {
                            tmpl = proxy(tmpl, state.storage);
                        }

                        html += '<div class="k-edit-field">' + tmpl(model) + '</div>';
                    }
                }
            }

            if (!that._isMobile && angular.isDefined(details)) {
                container = that._editContainer = $(html)
                    .appendTo(that.wrapper).eq(0)
                    .kendoWindow(extend({
                        modal: true,
                        resizable: false,
                        draggable: true,
                        width: details.width,
                        height: details.height,
                        title: details.title || 'Details',
                        visible: false,
                        close: function(e) {
                            if (e.userTriggered) {
								e.sender.element.focus();

								var currentIndex = that.items().index($(that.current()).parent());

								that._cancelDetailRow();
								that._refreshCloseDetail();
								if (that.options.navigatable) {
									that.current(that.items().eq(currentIndex).children().filter(NAVCELL).first());
									focusTable(that.table, true);
								}
                            }
                        }
                    }, options));
            }

			if (that._editContainer) {
				that.editable = that._editContainer
					.kendoEditable({
						fields: fields,
						model: model,
						clearContainer: false,
						target: that
					}).data("kendoEditable");


				that._openPopUpEditor();
			}

        },

        showDetails: function (row) {
            var that = this,
                model,
				container;

            if (row instanceof kendo.data.ObservableObject) {
                model = row;
            } else {
                row = $(row);
				var id = row.attr(kendo.attr("uid"));
                model = this.dataSource.getByUid(id);
            }

            //Se comenta para que no se modifique el estilo del registro
            //that._cancelDetailRow();
            //that.cancelRow();

            if (model) {
                that._createDetailEditor(model);
				
				container = that.editView ? that.editView.element : that._editContainer;

                if (container) {
                    if (!this._editCancelClickHandler) {
                        this._editCancelClickHandler = proxy(this._editCancelClick, this);
                    }

                    container.on(CLICK + NS, "a.k-grid-cancel", this._editCancelClickHandler);
                }
            }
            $('.k-window input[type="text"]:visible').each(
                    function() {
                        var control = $(this).closest('.k-edit-field');
                        if(control.length>0 && control[0].firstChild.localName != 'span'){
                            control.append($(this).val()).children().hide(); 
                        }else{
                            control.addClass("cb-grid-read-detail");
                        }
                    });
        }, 
		
		cancelRow: function() {
			var that = this,
                container = that._editContainer,
				model,
				uid,
				index,
				row,
				detailRow;
			
			if (container) {
				//It gets the model row of current editable row
				model = that._modelForContainer(container);
				collapseAndDestroyCurrentDetail(that, model);
			}
			kendo.ui.Grid.fn.cancelRow.call(that);
			moveHierarchyCellToTheLastColumn(that, model);
        },
		
		saveRow: function() {
			var that = this,
                container = that._editContainer,
                model = that._modelForContainer(container);
			
			collapseAndDestroyCurrentDetail(that, model);
            kendo.ui.Grid.fn.saveRow.call(that);
        },
		
		destroy: function() {
			var that = this;
			if (typeof that.__destroyed === 'undefined') {
				that.__destroyed = true;
				kendo.ui.Grid.fn.destroy.call(that);				
			}
		}
    });
    kendo.ui.plugin(ExtGrid);
}(window.kendo.jQuery, window.kendo));