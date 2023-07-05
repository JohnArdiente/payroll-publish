const joLstCont = $('#joborder_list');
const joPayrollLstCont = $('#joborder_payroll_list');
const joEdtPayroll = $('#edit_joborder_payroll');
const loadingOverlay = "<div class='overlay d-flex justify-content-center align-items-center' id='overlay'><i class='fas fa-2x fa-sync-alt fa-spin'></i></div>";
const noLoadingOverlay = "<div class='overlay dark' id='overlay'></div>";
let protocol = window.location.protocol;
let host = window.location.hostname;
let base_url = protocol + '://' + host + '/';
let listsHtml;
let currentUserId;
let isLoading = false;
let salary_charge;
let disbursement = window.location.search.substring(1).split('=')[1];
let JobStatus = window.location.pathname;

$(function () {
});

//LOAD REGULAR EMPLOYEES
loadJobOrderList = (sc) => {
    let url = '/Lists/JobOrder';
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            type: disbursement,
            salaryCharge: sc
        },
        async: true,
        beforeSend: function () {
            joLstCont.parent().append(loadingOverlay);
        },
        success: function (output) {
            setTimeout(function () {
                joLstCont.parent().find('.overlay').remove();
                joLstCont.html(output);
                LoadListJs(sc);
            }, 500);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status === 401) {
                location.reload();
            }
            else {
                alert(xhr.responseText);
                alert(thrownError);
            }
        }
    });
}

//LOAD COMPUTATIONS
loadComputationsList = (row, userid) => {
    currentUserId = userid;
    if (row !== 'undefined') {
        $(row).addClass('table-active').siblings().removeClass('table-active');
    }

    joLstCont.addClass('loading');
    LoadComputationsList(currentUserId).done(function () {
        LoadEditComputables(currentUserId).done(function () {
            joLstCont.removeClass('loading');
        });
    });
}

//LOAD LISTS
function LoadComputationsList(userid) {
    let dfrd = $.Deferred();
    var url = '/Lists/JobOrderComputationsList'
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            userid: userid
        },
        async: true,
        beforeSend: function () {
            joPayrollLstCont.parent().append(loadingOverlay);
            joEdtPayroll.parent().append(loadingOverlay);
        },
        success: function (output) {
            listsHtml = output;
            dfrd.resolve();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status === 401) {
                location.reload();
            }
            else {
                alert(xhr.responseText);
                alert(thrownError);
            }
        }
    });

    return dfrd.promise();
}

//LOAD EDITABLES
function LoadEditComputables(userid, id) {
    var dfrd1 = $.Deferred();
    $.ajax({
        url: '/Edit/JobOrderPayroll',
        method: 'GET',
        async: true,
        data: {
            userid: userid,
            id: id
        },
        success: function (output) {
            setTimeout(function () {
                joEdtPayroll.parent().find('.overlay').remove();
                joPayrollLstCont.parent().find('.overlay').remove();
                joEdtPayroll.html(output);
                joPayrollLstCont.html(listsHtml);
                if ($(output).find('.id').val() == '0') {
                    $('#save_computation').html('SAVE');
                }
                else {
                    $('#save_computation').html('UPDATE');
                }
                LoadJs();
                dfrd1.resolve();
            }, 500);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status === 401) {
                location.reload();
            }
            else {
                alert(xhr.responseText);
                alert(thrownError);
            }
        }
    });

    return dfrd1.promise();
}

//LOAD LIST JS
function LoadListJs(sc) {
    $.ajax({
        url: '/Lists/JobOrderJs',
        method: 'GET',
        async: true,
        success: function (output) {
            $('body').find('#list_scripts').remove();
            $('body').append(output);
            LoadFilterView(sc);
        }
    });
}

function LoadFilterView(sc) {
    $.ajax({
        url: '/Lists/JobOrderSalaryCharge',
        data: {
            type: disbursement,
            salaryCharge: sc
        },
        method: 'GET',
        async: true,
        success: function (output) {
            $('#joborder_lists_wrapper').find('.row').children().first().html(output);
        }
    })
}

//LOAD JS
function LoadJs() {
    $.ajax({
        url: '/Edit/JobOrderPayrollJs',
        method: 'GET',
        async: true,
        success: function (output) {
            $('body').find('#scripts').remove();
            $('body').append(output);
        }
    });
}

//COMPUTE DEDUCTIONS
function ComputeJoDeductions() {
    // LEGEND: jo_manual_deduction jo_manual_no_deduction
    //   -LUA = Late/Undertime/Abseces
    var month = joEdtPayroll.find('#jo_month').val();
    var range = joEdtPayroll.find('#jo_range').is(':checked');
    var joPremium = joEdtPayroll.find('#jo_premium').val();
    var joAdjustment = joEdtPayroll.find('#jo_adjustment').val().replace(',','');
    var joSalary = joEdtPayroll.find('#jo_salary').val().replace(',', '');
    var joWorkingDays = joEdtPayroll.find('#jo_working_days').val();
    var joMinutesLate = joEdtPayroll.find('#jo_minutes_late').val();
    var joAbsentDays = $('#jo_absent_date').datepicker('getDates').length;
    var joEWT = joEdtPayroll.find('#jo_ewt').val().replace(',', '');
    var joProfTax = joEdtPayroll.find('#jo_tax').val().replace(',', '');
    var joCoop = joEdtPayroll.find('#jo_hwmpc').val().replace(',', '');
    var joOtherAdjustments = joEdtPayroll.find('#jo_other_adjustments').val().replace(',', '');
    var joPagibig = joEdtPayroll.find('#jo_pagibig').val().replace(',', '');
    var joPhic = joEdtPayroll.find('#jo_phic').val().replace(',', '');
    var joGSIS = joEdtPayroll.find('#jo_gsis').val().replace(',', '');
    var joPagibigLoan = joEdtPayroll.find('#jo_pagibigloan').val().replace(',', '');
    var joSSS = joEdtPayroll.find('#jo_sss').val().replace(',', '');
    var joManualDeduction = joEdtPayroll.find('#jo_manual_deduction').val().replace(',', '');
    var joManualAbsentDays = joEdtPayroll.find('#jo_manual_no_deduction').val().replace(',', '');
    var joDeduction = ((+joMinutesLate + (480 * +joAbsentDays)) * (((+joSalary / +joWorkingDays) / 8) / 60));
    if (isNaN(joDeduction) || !isFinite(joDeduction)) {
        deduction = 0.00;
    }
    joDeduction = roundOff(+joDeduction + joManualDeduction);
    var salaryReal = +joSalary / 2;
    if (range == true && (month == 6 || month == 12)) {
        salaryReal = salaryReal / 2;
        var message = $('<i>').addClass('font-weight-light text-danger').attr('id', 'jo_endo').html('(end of contract)');
        if (joEdtPayroll.find('#jo_endo').length != 1) {
            joEdtPayroll.find('#gross_amt').append(message);
        }
    }
    else {
        joEdtPayroll.find('#jo_endo').remove();
    }

    var joGrossAmount = roundOff((+salaryReal + +joAdjustment) - +joDeduction);

    joGrossAmount = roundOff(+joGrossAmount * +joPremium);
    var joTotalDeduction = roundOff(+joEWT + +joProfTax + +joCoop + +joOtherAdjustments + +joPagibig + +joPhic + +joGSIS + +joPagibigLoan + +joSSS);
    var joNetPay = roundOff(+joGrossAmount - +joTotalDeduction);

    joEdtPayroll.find('#jo_deduction').val((+joDeduction).toLocaleString());
    joEdtPayroll.find('#jo_total_deductions').val((+joTotalDeduction).toLocaleString());
    joEdtPayroll.find('#jo_gross_amount').val((+joGrossAmount).toLocaleString());
    joEdtPayroll.find('#jo_total_amount').val((+joNetPay).toLocaleString());
}

//SUBMIT FORM
async function SubmitComputable() {
    let form = joEdtPayroll.find('form');
    if (form.length != 0) {
        let userid = form.find('#userid').val();
        let url = form.attr('action');
        let absent_days = await GetAbsentDays();
        let dataToSend = new FormData(form[0]);
        if (absent_days.length) {
            $.grep(absent_days, function (value) {
                dataToSend.append('absentDays[]', value);
            });
        }
        else {
            dataToSend.append('absentDays', absent_days);
        }
        $.ajax({
            url: url,
            method: 'POST',
            async: true,
            data: dataToSend,
            processData: false,
            contentType: false,
            success: function (output) {
                if (!Array.isArray(output)) {
                    if (output.result) {
                        toastr.success(output.message);
                        var payroll_id = form.find('#payroll_id').val();
                        if (payroll_id != 0) {
                            LoadEditComputables(userid, payroll_id);
                        }
                    }
                    else {
                        toastr.error(output.message);
                    }
                }
                else {
                    $.each(output, function (index, values) {
                        console.log(values);
                        if (values.result) {
                            toastr.success(values.message);
                            var payroll_id = form.find('#payroll_id').val();
                            if (payroll_id != 0) {
                                LoadEditComputables(userid, payroll_id);
                            }
                        }
                        else {
                            toastr.error(values.message);
                        }
                    });
                }
                LoadComputationsList(userid).then(
                    function () {
                        setTimeout(function () {
                            joEdtPayroll.parent().find('.overlay').remove();
                            joPayrollLstCont.parent().find('.overlay').remove();
                            joPayrollLstCont.html(listsHtml);
                        }, 100);
                    },
                    function (error) { console.log(error); });
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status === 401) {
                    location.reload();
                }
                else {
                    alert(xhr.responseText);
                    alert(thrownError);
                }
            }
        });

        function GetAbsentDays() {
            let dateArr = [];
            let dates = $('#jo_absent_date').datepicker('getDates');
            $.grep(dates, function (value) {
                dateArr.push(value.toLocaleDateString());
            });
            return dateArr;
        }
    }
    else {
        toastr.error("ERROR");
    }
}

//DELETE
async function DeleteDbRow(id, userid) {
    if (confirm('Confirm Delete?')) {
        var url = '/Edit/DeleteRow';
        $.ajax({
            url: url,
            data: {
                id: id,
                table: 'payroll'
            },
            type: 'DELETE',
            async: true,
            success: function (output) {
                if (output.result) {
                    toastr.success('DELETED')
                }
                LoadComputationsList(userid).then(
                    function () {
                        setTimeout(function () {
                            joPayrollLstCont.parent().find('.overlay').remove();
                            joEdtPayroll.parent().find('.overlay').remove();
                            joPayrollLstCont.html(listsHtml);
                        }, 100);
                    },
                    function (error) { console.log(error); });

            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (xhr.status === 401) {
                    location.reload();
                }
                else {
                    alert(xhr.responseText);
                    alert(thrownError);
                }
            }
        });
    }
}

//SET SALARY CHARGE
function setSalaryCharge(sg) {
    salary_charge = sg;
    loadJobOrderList(sg);
}

//OPEN JO GENERATE PAYROLL MODAL
function GenerateJobOrderPayroll() {
    let url = '/Edit/GenerateJoPayroll';
    console.log(salary_charge);
    $.ajax({
        type: 'GET',
        async: true,
        url: url,
        data: {
            salaryCharge: $("#regular_sg_filter").val(),
            type: disbursement
        },
        success: function (res) {
            $('#form_modal .modal-dialog').addClass('modal-def');
            $('#form_modal .modal-content').html(res);
            $('#form_modal').modal('show');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            if (xhr.status === 401) {
                location.reload();
            }
            else {
                alert(xhr.responseText);
                alert(thrownError);
            }
        }
    })
}

//GENERATE JO MODAL
function SubmitGenerateModal(form) {
    try {
        $.ajax({
            type: 'POST',
            url: form.action,
            data: new FormData(form),
            contentType: false,
            processData: false,
            beforeSend: function () {
                $('#form_modal .modal-content').prepend(loadingOverlay);
            },
            success: function (output) {
                if (output.result) {
                    joPayrollLstCont.empty();
                    if (joPayrollLstCont.parent().find(".overlay").length == 0) {
                        joPayrollLstCont.parent().append(noLoadingOverlay);
                    }
                    joEdtPayroll.empty();
                    if (joEdtPayroll.parent().find(".overlay").length == 0) {
                        joEdtPayroll.parent().append(noLoadingOverlay);
                    }

                    $('#form_modal').modal('hide');
                    $('#form_modal .modal-dialog').removeClass('modal-def');
                    $('#form_modal .modal-content').empty();
                }

                toastr.success(output.message);
            },
            error: function (err) {
                console.log(err)
            }
        })
        //to prevent default form submit event
        return false;
    } catch (ex) {
        console.log(ex)
    }
}


//NO SALARY
function NoSalary() {
    $('#jo_salary').val('0.00');
    ComputeJoDeductions();
}



/*
 * SUMBIIT UPDATE SALARY
 */
function SubmitModal(form) {
    try {
        $.ajax({
            type: 'POST',
            url: form.action,
            data: new FormData(form),
            contentType: false,
            processData: false,
            beforeSend: function () {
                $('#form_modal .modal-content').prepend(loadingOverlay);
            },
            success: function (output) {
                if (output.result) {
                    toastr.success(output.message);
                    $('#jo_salary').val(output.salary.toLocaleString('en-US', { minimumFractionDigits: 2 }));
                    ComputeJoDeductions();
                }
                else {
                    toastr.error(output.message);
                }
                $('#form_modal').modal('hide');
                $('#form_modal .modal-dialog').removeClass('modal-sm');
                $('#form_modal .modal-content').empty();
            },
            error: function (err) {
                console.log(err)
            }
        })
        //to prevent default form submit event
        return false;
    } catch (ex) {
        console.log(ex)
    }
}

//DELETE REMITTANCE
function DeleteRemittance(id, table) {
    if (confirm("Confirm delete?")) {
        $.ajax({
            url: '/Edit/DeleteRemittance',
            method: 'POST',
            async: true,
            data: {
                id: id,
                jobStatus: 'jo'
            },
            success: function (output) {
                if (output.result) {
                    table.find('input').each(function () {
                        this.value = 0;
                    });
                    toastr.success(output.message);
                    table.find('.float-right').remove();
                }
                else {
                    toastr.error(output.message);
                }
            }
        });
    }
}