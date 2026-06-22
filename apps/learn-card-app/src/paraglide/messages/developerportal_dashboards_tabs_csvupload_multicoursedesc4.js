/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs */

const en_developerportal_dashboards_tabs_csvupload_multicoursedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`You have ${i?.count} course templates. Your CSV can include rows for different courses.`)
};

const es_developerportal_dashboards_tabs_csvupload_multicoursedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Tienes ${i?.count} plantillas de curso. Tu CSV puede incluir filas para diferentes cursos.`)
};

const fr_developerportal_dashboards_tabs_csvupload_multicoursedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vous avez ${i?.count} modèles de cours. Votre CSV peut inclure des lignes pour différents cours.`)
};

const ar_developerportal_dashboards_tabs_csvupload_multicoursedesc4 = /** @type {(inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لديك ${i?.count} قالب دورة تدريبية. يمكن أن يتضمن CSV الخاص بك صفوفًا لدورات مختلفة.`)
};

/**
* | output |
* | --- |
* | "You have {count} course templates. Your CSV can include rows for different courses." |
*
* @param {Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_dashboards_tabs_csvupload_multicoursedesc4 = /** @type {((inputs: Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Dashboards_Tabs_Csvupload_Multicoursedesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_dashboards_tabs_csvupload_multicoursedesc4(inputs)
	if (locale === "es") return es_developerportal_dashboards_tabs_csvupload_multicoursedesc4(inputs)
	if (locale === "fr") return fr_developerportal_dashboards_tabs_csvupload_multicoursedesc4(inputs)
	return ar_developerportal_dashboards_tabs_csvupload_multicoursedesc4(inputs)
});
export { developerportal_dashboards_tabs_csvupload_multicoursedesc4 as "developerPortal.dashboards.tabs.csvUpload.multiCourseDesc" }