

$(function () {
    $('#form_modal').on('hidden.bs.modal', function () {
        $('.modal-dialog').attr('class', 'modal-dialog');
        $('.modal-content').empty();
    });
});

/*
 * OPEN ENABLE VIEW MODAL
 */
function EnableViewModal(job_status) {
    let url = '/Edit/PayslipDates';
    console.log(job_status);
    if (job_status == "jo") {
        url += "?jobStatus=Job Order";
    }
    else {
        url += "?jobStatus=Permanent";
    }
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

/*
 * TOGGLE ENABLE DATE
 */
function ToggleDate(input, job_status) {
    let url = '/Edit/EditPayslipView';
    $.ajax({
        url: url,
        method: 'POST',
        async: true,
        data: {
            date: $(input).val(),
            set: $(input)[0].checked,
            jobStatus: job_status
        },
        success: function (output) {

        }
    })
}

/*
 * Round off to the nearest 2
 */
function roundOff(number) {
    if (number === '') number = 0;
    number = (Math.round((parseFloat(number) + 0.00001) * 100) / 100)
    return parseFloat(number).toFixed(2);
}


/*
 * REMOVE SPECIAL CHARACTERS
 */
function RemoveSpecialChars(str) {
    return str.replace(',', '');
}


/*
 * FORMAL NUMBERS
 */
function FormalNumbers(number) {
    return (+number).toLocaleString();
}



/*
 * CONVERTS DATE
 */
function ConvertDate(str) {
    var date = new Date(str),
        mnth = ("0" + (date.getMonth() + 1)).slice(-2),
        day = ("0" + date.getDate()).slice(-2);
    return [mnth, day, date.getFullYear()].join("/");
}

/*
 * UPDATE SALARY
 */
function UpdateSalary(userid) {
    let url = '/Edit/UpdateSalary';
    $.ajax({
        type: 'GET',
        url: url,
        data: {
            userid: userid
        },
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
    })
}