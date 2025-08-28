/* Function changes string from YYYY-MM-DD date format to MM/DD/YYYY
 * @param (String) originalDate
 */
function toICMFormat(originalDate) {
    if (originalDate === '' || originalDate === null) { // If the date is empty, no need to proceed
        return originalDate;
    }
    let newDate = ''; // The new date to be created
    try {
    const yearMonthDay = originalDate.split("-"); // Split into array [Year, Month, Day]
    newDate = yearMonthDay[1] + "/" + yearMonthDay[2] + "/" + yearMonthDay[0] // Turn into "Month/Day/Year"
    } catch (e) {
        console.log("Something went wrong with configuring the date!");
        console.error(e);
        return "-1";
    }
    return newDate;
}

// Export the function so it can be used in other files
module.exports = { toICMFormat };