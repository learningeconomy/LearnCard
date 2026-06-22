/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_InstallInputs */

const en_launchpad_detail_install = /** @type {(inputs: Launchpad_Detail_InstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Install`)
};

const es_launchpad_detail_install = /** @type {(inputs: Launchpad_Detail_InstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Instalar`)
};

const fr_launchpad_detail_install = /** @type {(inputs: Launchpad_Detail_InstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Installer`)
};

const ar_launchpad_detail_install = /** @type {(inputs: Launchpad_Detail_InstallInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تثبيت`)
};

/**
* | output |
* | --- |
* | "Install" |
*
* @param {Launchpad_Detail_InstallInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_install = /** @type {((inputs?: Launchpad_Detail_InstallInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_InstallInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_install(inputs)
	if (locale === "es") return es_launchpad_detail_install(inputs)
	if (locale === "fr") return fr_launchpad_detail_install(inputs)
	return ar_launchpad_detail_install(inputs)
});
export { launchpad_detail_install as "launchpad.detail.install" }