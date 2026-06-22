/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Assistance1Inputs */

const en_wallet_categorydescriptor_descriptions_assistance1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodations are adjustments made to the environment or processes to enable students, employees, or participants with disabilities to participate fully. Examples include providing extra time on tests for students with learning disabilities, offering sign language interpreters for individuals who are deaf, adjusting work schedules for those with medical needs, or modifying a workspace for accessibility.`)
};

const es_wallet_categorydescriptor_descriptions_assistance1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las adaptaciones son ajustes realizados en el entorno o los procesos para que los estudiantes, empleados o participantes con discapacidad puedan participar plenamente. Algunos ejemplos son dar tiempo adicional en los exámenes a estudiantes con dificultades de aprendizaje, ofrecer intérpretes de lengua de señas a personas sordas, ajustar los horarios laborales para quienes tienen necesidades médicas o modificar un espacio de trabajo para mejorar la accesibilidad.`)
};

const fr_wallet_categorydescriptor_descriptions_assistance1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les aménagements sont des ajustements apportés à l'environnement ou aux processus afin de permettre aux étudiants, aux employés ou aux participants en situation de handicap de participer pleinement. Par exemple : accorder du temps supplémentaire lors des examens aux étudiants ayant des troubles de l'apprentissage, proposer des interprètes en langue des signes aux personnes sourdes, adapter les horaires de travail en fonction des besoins médicaux ou modifier un espace de travail pour le rendre accessible.`)
};

const ar_wallet_categorydescriptor_descriptions_assistance1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Assistance1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`التيسيرات هي تعديلات تُجرى على البيئة أو العمليات لتمكين الطلاب أو الموظفين أو المشاركين من ذوي الإعاقة من المشاركة الكاملة. ومن الأمثلة على ذلك منح وقت إضافي في الاختبارات للطلاب الذين يعانون من صعوبات في التعلّم، وتوفير مترجمي لغة الإشارة للأشخاص الصمّ، وتعديل جداول العمل لمن لديهم احتياجات طبية، أو تعديل مكان العمل لتحسين إمكانية الوصول.`)
};

/**
* | output |
* | --- |
* | "Accommodations are adjustments made to the environment or processes to enable students, employees, or participants with disabilities to participate fully. Ex..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Assistance1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_assistance1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Assistance1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Assistance1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_assistance1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_assistance1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_assistance1(inputs)
	return ar_wallet_categorydescriptor_descriptions_assistance1(inputs)
});
export { wallet_categorydescriptor_descriptions_assistance1 as "wallet.categoryDescriptor.descriptions.assistance" }