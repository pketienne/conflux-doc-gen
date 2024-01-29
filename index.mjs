import puppeteer from 'puppeteer';


export const handler = async (event) => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const website_url = 'https://storage.googleapis.com/theme-vessel-items/checking-sites-2/disee-html/HTML/main/invoice-1.html'
	await page.goto(website_url, { waitUntil: "networkidle0" });
	await page.emulateMediaType("screen");
	const pdf = await page.pdf({
		path: "result.pdf",
		printBackground: true,
		format: "A4",
	});
	await browser.close();

  const response = {
    statusCode: 200,
		body: pdf,
    // body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
