/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_Preview_CertificateInputs */

const en_boost_cms_preview_certificate = /** @type {(inputs: Boost_Cms_Preview_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificate`)
};

const es_boost_cms_preview_certificate = /** @type {(inputs: Boost_Cms_Preview_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificado`)
};

const fr_boost_cms_preview_certificate = /** @type {(inputs: Boost_Cms_Preview_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat`)
};

const ar_boost_cms_preview_certificate = /** @type {(inputs: Boost_Cms_Preview_CertificateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شهادة`)
};

/**
* | output |
* | --- |
* | "Certificate" |
*
* @param {Boost_Cms_Preview_CertificateInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_preview_certificate = /** @type {((inputs?: Boost_Cms_Preview_CertificateInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_Preview_CertificateInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_preview_certificate(inputs)
	if (locale === "es") return es_boost_cms_preview_certificate(inputs)
	if (locale === "fr") return fr_boost_cms_preview_certificate(inputs)
	return ar_boost_cms_preview_certificate(inputs)
});
export { boost_cms_preview_certificate as "boost.cms.preview.certificate" }