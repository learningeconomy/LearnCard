/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Appinstall_Willbeableto4Inputs */

const en_appinstall_willbeableto4 = /** @type {(inputs: Appinstall_Willbeableto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This app will be able to:`)
};

const es_appinstall_willbeableto4 = /** @type {(inputs: Appinstall_Willbeableto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta aplicación podrá:`)
};

const fr_appinstall_willbeableto4 = /** @type {(inputs: Appinstall_Willbeableto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette application pourra :`)
};

const ar_appinstall_willbeableto4 = /** @type {(inputs: Appinstall_Willbeableto4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتمكن هذا التطبيق من:`)
};

/**
* | output |
* | --- |
* | "This app will be able to:" |
*
* @param {Appinstall_Willbeableto4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const appinstall_willbeableto4 = /** @type {((inputs?: Appinstall_Willbeableto4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Appinstall_Willbeableto4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_appinstall_willbeableto4(inputs)
	if (locale === "es") return es_appinstall_willbeableto4(inputs)
	if (locale === "fr") return fr_appinstall_willbeableto4(inputs)
	return ar_appinstall_willbeableto4(inputs)
});
export { appinstall_willbeableto4 as "appInstall.willBeAbleTo" }