/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Actions_Scanqrcode2Inputs */

const en_launchpad_actions_scanqrcode2 = /** @type {(inputs: Launchpad_Actions_Scanqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scan a QR Code`)
};

const es_launchpad_actions_scanqrcode2 = /** @type {(inputs: Launchpad_Actions_Scanqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Escanear un código QR`)
};

const fr_launchpad_actions_scanqrcode2 = /** @type {(inputs: Launchpad_Actions_Scanqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Scanner un code QR`)
};

const ar_launchpad_actions_scanqrcode2 = /** @type {(inputs: Launchpad_Actions_Scanqrcode2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مسح رمز QR`)
};

/**
* | output |
* | --- |
* | "Scan a QR Code" |
*
* @param {Launchpad_Actions_Scanqrcode2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_actions_scanqrcode2 = /** @type {((inputs?: Launchpad_Actions_Scanqrcode2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Actions_Scanqrcode2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_actions_scanqrcode2(inputs)
	if (locale === "es") return es_launchpad_actions_scanqrcode2(inputs)
	if (locale === "fr") return fr_launchpad_actions_scanqrcode2(inputs)
	return ar_launchpad_actions_scanqrcode2(inputs)
});
export { launchpad_actions_scanqrcode2 as "launchpad.actions.scanQrCode" }