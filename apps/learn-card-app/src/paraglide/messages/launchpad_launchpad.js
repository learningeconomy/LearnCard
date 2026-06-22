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

const fr_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Launchpad`)
};

const ar_launchpad_launchpad = /** @type {(inputs: Launchpad_LaunchpadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`منصة الإطلاق`)
};

/**
* | output |
* | --- |
* | "Launchpad" |
*
* @param {Launchpad_LaunchpadInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_launchpad = /** @type {((inputs?: Launchpad_LaunchpadInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_LaunchpadInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_launchpad(inputs)
	if (locale === "es") return es_launchpad_launchpad(inputs)
	if (locale === "fr") return fr_launchpad_launchpad(inputs)
	return ar_launchpad_launchpad(inputs)
});
export { launchpad_launchpad as "launchpad.launchpad" }