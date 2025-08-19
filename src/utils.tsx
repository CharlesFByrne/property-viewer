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

export function generateUniqueID(randomDigits = 2) {
  // This can be made more complex, e.g., use of a counter also
  // now = milliseconds since the Unix epoch (January 1, 1970, 00:00:00 UTC).
  const timestamp = Date.now().toString(36); // Convert timestamp to Base-36
  const maxRandom = Math.pow(36, randomDigits); // Maximum value for n digits in Base-36
  const randomPart = Math.floor(Math.random() * maxRandom)
    .toString(36)
    .padStart(randomDigits, "0"); // Random part in Base-36
  return `${timestamp}${randomPart}`;
}
