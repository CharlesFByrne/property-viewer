export function printDateTime(dateString: string, friendlier = false) {
  const thisDate = new Date(dateString);

  let hours = thisDate.getHours();
  const minutes = thisDate.getMinutes();
  const seconds = thisDate.getSeconds();

  let ampm = "";

  if (friendlier) {
    ampm = hours >= 12 ? "PM" : "AM";

    // Convert to 12-hour format
    hours = hours % 12;
    if (hours === 0) hours = 12; // midnight or noon should be "12"
  }

  const secondPrinted = friendlier
    ? ""
    : `:${seconds.toString().padStart(2, "0")}`;

  const hoursAndMinutes =
    hours === 0 && minutes === 0 && seconds === 0
      ? ""
      : `${friendlier ? " at " : " "}${hours}:${minutes
          .toString()
          .padStart(2, "0")}${secondPrinted}${friendlier ? " " + ampm : ""}`;

  return `${thisDate.getDate()}/${
    thisDate.getMonth() + 1
  }/${thisDate.getFullYear()}${hoursAndMinutes}`;
}
