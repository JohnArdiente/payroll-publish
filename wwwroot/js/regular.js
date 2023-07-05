const regLstCont = $('#regular_list');
const regPayrollLstCont = $('#regular_payroll_list');
const regEdtPayroll = $('#edit_regular_payroll');
const loadingOverlay = "<div class='overlay d-flex justify-content-center align-items-center' id='overlay'><i class='fas fa-2x fa-sync-alt fa-spin'></i></div>";
const noLoadingOverlay = "<div class='overlay dark' id='overlay'></div>";
let protocol = window.location.protocol;
let host = window.location.hostname;
let base_url = protocol + '://' + host + '/';
let listsHtml;
let currentUserId;
let options_container = $('#radio_options');
let selected_option = 0;
let isLoading = false;
let currentHeaderColor = 'bg-primary';
let currentBtnColor = 'bg-gradient-primary';
let salary_charge = 'LHSD';
let JobStatus = window.location.pathname;

$(function () {
    options_container.find('input[type=radio]').change(function () {
        selected_option = +this.value;
        LoadComputationsList(currentUserId).done(function () {
            LoadEditComputables(currentUserId).done(function () {
                $('.content').find('.' + currentHeaderColor).removeClass(currentHeaderColor).addClass(getHeaderColor());
                currentHeaderColor = getHeaderColor();
            });
        });
    });
});

//LOAD REGULAR EMPLOYEES
loadRegularList = (sc) => {
    let url = '/Lists/Regular';
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            salaryCharge: sc
        },
        async: true,
        beforeSend: function () {
            regLstCont.parent().append(loadingOverlay);
        },
        success: function (output) {
            setTimeout(function () {
                regLstCont.parent().find('.overlay').remove();
                regLstCont.html(output);
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

    regLstCont.addClass('loading');
    LoadComputationsList(currentUserId).done(function () {
        LoadEditComputables(currentUserId).done(function () {
            regLstCont.removeClass('loading');
        });
    });
}

//SUBMIT 
function SubmitComputable() {
    let form = regEdtPayroll.find('form');
    if (form.length != 0) {
        let userid = form.find('#userid').val();
        let url = form.attr('action');
        let absent_days = GetAbsentDays();
        let dataToSend = new FormData(form[0]);
        if (absent_days.length) {
            $.grep(absent_days, function (value) {
                var newDate = moment(value).format("DD/MM/YYYY");
                //console.log(newDate);
                console.log(url);
                dataToSend.append('absentDays[]', newDate);
                //dataToSend.append('absentDays[]', value);
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
                if (output.result) {
                    console.log(url);
                    toastr.success(output.message);
                    var payrollId = form.find('#payroll_id').val();
                    if (payrollId != 0) {
                        LoadEditComputables(userid, payrollId);
                    }
                }
                else {
                    toastr.error(output.message);
                }
                LoadComputationsList(userid).then(
                    function () {
                        setTimeout(function () {
                            regEdtPayroll.parent().find('.overlay').remove();
                            regPayrollLstCont.parent().find('.overlay').remove();
                            regPayrollLstCont.html(listsHtml);
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
            let dates = $('#regular_absent_date').datepicker('getDates');
            $.grep(dates, function (value) {
                console.log(value.toLocaleDateString());
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
    if (confirm("Confirm Delete?")) {
        var url = '/Edit/DeleteRow';
        $.ajax({
            url: url,
            data: {
                id: id,
                table: getTable()
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
                            regPayrollLstCont.parent().find('#overlay').remove();
                            regEdtPayroll.parent().find('#overlay').remove();
                            regPayrollLstCont.html(listsHtml);
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


//LOAD LISTS
function LoadComputationsList(userid) {
    let dfrd = $.Deferred();
    var url = '/Lists/RegularComputationsList'
    $.ajax({
        url: url,
        method: 'GET',
        data: {
            userid: userid,
            option: selected_option
        },
        async: true,
        beforeSend: function () {
            regPayrollLstCont.parent().append(loadingOverlay);
            regEdtPayroll.parent().append(loadingOverlay);
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
        url: editUrls(),
        method: 'GET',
        async: true,
        data: {
            userid: userid,
            id: id
        },
        success: function (output) {
            setTimeout(function () {
                regEdtPayroll.parent().find('.overlay').remove();
                regPayrollLstCont.parent().find('.overlay').remove();
                regEdtPayroll.html(output);
                regPayrollLstCont.html(listsHtml);
                if ($(output).find('.id').val() == '0') {
                    $('#save_computation').html('SAVE');
                }
                else if ($(output).find('.id').val() > 0) {
                    $('#save_computation').html('UPDATE');
                }
                else {
                    $('#save_computation').html('');
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

//LOAD JS
function LoadJs() {
    $.ajax({
        url: editJsUrls(),
        method: 'GET',
        async: true,
        success: function (output) {
            $('body').find('#scripts').remove();
            $('body').append(output);
        }
    });
}
//LOAD LIST JS
function LoadListJs(sc) {
    $.ajax({
        url: '/Lists/RegularJs',
        method: 'GET',
        async: true,
        success: function (output) {
            $('body').find('#list_scripts').remove();
            $('body').append(output);
            LoadFilterView(sc);
        }
    });
}

//GENERATE PDF
function GeneratePdf() {
    console.log('delete computation');
}

//GET CURRENT OPTION
function GetCurrentOption() {
    return selected_option;
}

//URLS
function editUrls() {
    switch (selected_option) {
        case 0: return '/Edit/RegularPayroll';
        case 1: return '/Edit/Hazard';
        case 2: return '/Edit/Longevity';
        case 3: return '/Edit/Subsistence';
        case 4: return '/Edit/ClothingAllowance';
        case 5: return '/Edit/Rata';
        case 6: return '/Edit/CommunicableAllowance';
    }
}
function editJsUrls() {
    switch (selected_option) {
        case 0: return '/Edit/RegularPayrollJs';
        case 1: return '/Edit/HazardJs';
        case 2: return '/Edit/LongevityJs';
        case 3: return '/Edit/SubsistenceJs';
        case 4: return '/Edit/ClothingAllowanceJs';
        case 5: return '/Edit/RataJs';
        case 6: return '/Edit/CommunicableAllowanceJs';
    }
}
function getTable() {
    switch (selected_option) {
        case 0: return 'regular_payroll';
        case 1: return 'hazard_pay';
        case 2: return 'longevity';
        case 3: return 'subsistence';
        case 4: return 'clothing_allowance';
        case 5: return 'rata';
        case 6: return 'communicable_allowance';
    }
}
function getHeaderColor() {
    switch (selected_option) {
        case 0: return 'bg-primary';
        case 1: return 'bg-warning';
        case 2: return 'bg-success';
        case 3: return 'bg-cyan';
        case 4: return 'bg-danger';
        case 5: return 'bg-pink';
        case 6: return 'bg-fuchsia';
    }
}
function setSalaryCharge(sg) {
    salary_charge = sg;
    loadRegularList(sg);
}

function LoadFilterView(sc) {
    $.ajax({
        url: '/Lists/RegularSalaryCharge',
        data: {
            salaryCharge: sc
        },
        method: 'GET',
        async: true,
        success: function (output) {
            $('#regular_lists_wrapper').find('.row').children().first().html(output);
        }
    })
}

function GenerateRegularPayroll() {
    let url = '/Edit/GeneratePayroll';
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            salaryCharge: salary_charge
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
                    if ($(form).attr('class') == 'bonus_form') {
                        UpdateBonusHtml(form.id, output.message);
                        ComputeReDeductions();
                    }
                    else {
                        regPayrollLstCont.empty();
                        if (regPayrollLstCont.parent().find(".overlay").length == 0) {
                            regPayrollLstCont.parent().append(noLoadingOverlay);
                        }
                        regEdtPayroll.empty();
                        if (regEdtPayroll.parent().find(".overlay").length == 0) {
                            regEdtPayroll.parent().append(noLoadingOverlay);
                        }
                    }

                }

                $('#form_modal').modal('hide');
                $('#form_modal .modal-dialog').removeClass('modal-def');
                $('#form_modal .modal-content').empty();
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

    function UpdateBonusHtml(form_id, amount) {
        switch (form_id) {
            case 'cna_form': $(regEdtPayroll).find('#cna_amount').html(amount); break;
            case 'pei_form': $(regEdtPayroll).find('#pei_amount').html(amount); break;
            case 'sri_form': $(regEdtPayroll).find('#sri_amount').html(amount); break;
            case 'OCA_form': $(regEdtPayroll).find('#oca_amount').html(amount); break;
            case 'phic_share_form': $(regEdtPayroll).find('#phs_amount').html(amount); break;
            case 'mid_year_form': $(regEdtPayroll).find('#md_yr_amount').html(amount); break;
        }
    }
}

function SubmitBonusModal(form) {
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

//COMPUTE DEDUCTIONS
function ComputeReDeductions() {
    var salary = regEdtPayroll.find('#regular_salary').val().trim();
    var pera = regEdtPayroll.find('#regular_pera').val().trim();
    var working_days = regEdtPayroll.find('#regular_working_days').val().trim();


    var absent_days = $('#regular_absent_date').datepicker('getDates').length;


    var mins_late = regEdtPayroll.find('#regular_minutes_late').val().trim();
    var deduction = 0.00;
    var manual_deduction = regEdtPayroll.find('#regular_manual_deduction').val().trim();
    deduction = ((+mins_late + (480 * +absent_days)) * (((+salary / + +working_days) / 8) / 60));
    deduction = roundOff(deduction + +manual_deduction);
    regEdtPayroll.find('#regular_deduction').val(deduction);
    var net_amt = (+salary + +pera) - +deduction;
    net_amt = roundOff(net_amt);

    regEdtPayroll.find('#regular_net_amount').val(net_amt);
    var other_deductions = regEdtPayroll.find('.other_deductions').find('.input-data');
    var sum_other_deductions = 0.00;
    for (var inputs of other_deductions) {
        var value = $(inputs).val().trim();
        sum_other_deductions += +value;
    }
    var total_deductions = +sum_other_deductions;
    regEdtPayroll.find('#regular_total_deductions').val(roundOff(total_deductions));

    let bonus_total = +0;
    $(regEdtPayroll).find('.re_bonus').each(function () {
        let bonus = +RemoveSpecialChars($(this).html());
        bonus_total += bonus;
    });

    var net_pay = +net_amt + +bonus_total - +sum_other_deductions;
    regEdtPayroll.find('#regular_total_amount').val(roundOff(net_pay));
}


//NO SALARY
function NoSalary() {
    if (confirm("Reset Salary?")) {
        $('#regular_salary').val('0.00');
        ComputeReDeductions();
    }
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
                    $('#regular_salary').val((+output.salary).toFixed(2));
                    ComputeReDeductions();
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
                jobStatus: 'regular'
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



//OPEN GENERATE BONUS
function GenerateBonusModal() {
    let url = '/Edit/GenerateBonus';
    $.ajax({
        type: 'GET',
        url: url,
        success: function (res) {
            $('#form_modal .modal-dialog').addClass('modal-sm');
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
    });
}

function GetBonusUrl(type) {
    switch (type) {
        case 'sri': return '/Edit/Sri';
        case 'cna': return '/Edit/Cna';
        case 'md_yr': return '/Edit/MidYear';
        case 'pei': return '/Edit/Bonus';
        case 'oca': return '/Edit/Bonus';
        case 'phs': return '/Edit/Bonus';
    }
}

//OPEN EDIT BONUS MODAL
function EditBonus(id, type) {
    let url = GetBonusUrl(type);
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            id: id,
            type: type
        },
        success: function (res) {
            $('#form_modal .modal-dialog').addClass('modal-default');
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
    });
}



