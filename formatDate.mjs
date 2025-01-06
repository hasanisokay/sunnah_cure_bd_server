const formatDate =(date)=> {
    return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        timeZone: "Asia/Dhaka",
    }).format(date);
}
export default formatDate;