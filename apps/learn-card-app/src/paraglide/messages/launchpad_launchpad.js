/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_LaunchpadInputs */

const en_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launchpad`)
};

const es_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launchpad`)
};

const de_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launchpad`)
};

const ar_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منصة الإطلاق`)
};

const fr_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launchpad`)
};

const ko_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`런치패드`)
};

/**
* | output |
* | --- |
* | "Launchpad" |
*
* @param {Launchpad_LaunchpadInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_launchpad = /** @type {((inputs?: Launchpad_LaunchpadInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_LaunchpadInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_launchpad(inputs)
	if (locale === "es") return es_launchpad_launchpad(inputs)
	if (locale === "de") return de_launchpad_launchpad(inputs)
	if (locale === "ar") return ar_launchpad_launchpad(inputs)
	if (locale === "fr") return fr_launchpad_launchpad(inputs)
	return ko_launchpad_launchpad(inputs)
});
export { launchpad_launchpad as "launchpad.launchpad" }