/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_UninstallInputs */

const en_launchpad_detail_uninstall = /** @type {(inputs: Launchpad_Detail_UninstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Uninstall`)
};

const es_launchpad_detail_uninstall = /** @type {(inputs: Launchpad_Detail_UninstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desinstalar`)
};

const fr_launchpad_detail_uninstall = /** @type {(inputs: Launchpad_Detail_UninstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Désinstaller`)
};

const ar_launchpad_detail_uninstall = /** @type {(inputs: Launchpad_Detail_UninstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء التثبيت`)
};

/**
* | output |
* | --- |
* | "Uninstall" |
*
* @param {Launchpad_Detail_UninstallInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_uninstall = /** @type {((inputs?: Launchpad_Detail_UninstallInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_UninstallInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_uninstall(inputs)
	if (locale === "es") return es_launchpad_detail_uninstall(inputs)
	if (locale === "fr") return fr_launchpad_detail_uninstall(inputs)
	return ar_launchpad_detail_uninstall(inputs)
});
export { launchpad_detail_uninstall as "launchpad.detail.uninstall" }