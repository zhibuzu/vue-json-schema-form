/**
 * Created by Liu.Jun on 2020/4/16 17:32.
 */

import {
    getCurrentInstance, watch, ref, computed, h
} from 'vue';

import { resolveComponent } from '@lljj/vjsf-utils/vue3Utils';

// 生成form表单默认数据
import getDefaultFormState from '@lljj/vjsf-utils/schema/getDefaultFormState';
import { deepEquals } from '@lljj/vjsf-utils/utils';

import vueProps from './props';

// 默认表单底部
import FormFooter from './components/FormFooter.js';

import SchemaField from './fields/SchemaField';

import './index.css';

export default function createForm(globalOptions = {}) {
    const Form = {
        name: 'VueElementForm',
        props: vueProps,
        emits: ['update:modelValue', 'change', 'cancel', 'submit', 'validation-failed'],
        setup(props, { slots, emit }) {
            // 注册组件
            const internalInstance = getCurrentInstance();
            Object.entries(globalOptions.WIDGET_MAP.widgetComponents).forEach(
                ([componentName, component]) => internalInstance.appContext.app.component(componentName, component)
            );

            // formData
            const formData = ref(getDefaultFormState(props.schema, props.value, props.schema));
            const footerParams = computed(() => ({
                show: true,
                okBtn: '保存',
                cancelBtn: '取消',
                ...props.formFooter
            }));

            const formRef = ref(null);

            // 更新formData
            const emitFormDataChange = (newValue, oldValue) => {
                // 支持v-model ，引用类型
                emit('update:modelValue', newValue);

                // change 事件，引用类型修改属性 newValue
                emit('change', {
                    newValue,
                    oldValue
                });
            };

            // 更新props
            const willReceiveProps = (newVal, oldVal) => {
                if (!deepEquals(newVal, oldVal)) {
                    const tempVal = getDefaultFormState(props.schema, props.value, props.schema);
                    if (!deepEquals(formData.value, tempVal)) {
                        formData.value = tempVal;
                    }
                }
            };

            // emit v-model，同步值
            watch(formData, (newValue, oldValue) => {
                emitFormDataChange(newValue, oldValue);
            }, {
                deep: true
            });

            // schema 被重新赋值
            watch(() => props.schema, (newVal, oldVal) => {
                willReceiveProps(newVal, oldVal);
            });

            // model value 变更
            watch(() => props.modelValue, (newVal, oldVal) => {
                willReceiveProps(newVal, oldVal);
            });

            // 保持v-model双向数据及时性
            emitFormDataChange(formData, props.modelValue);

            const getDefaultSlot = () => {
                if (slots.default) {
                    return slots.default({
                        formData,
                        formRefFn: () => formRef.value
                    });
                }

                if (footerParams.value.show) {
                    return h(FormFooter, {
                        globalOptions,
                        okBtn: footerParams.okBtn,
                        cancelBtn: footerParams.cancelBtn,
                        onCancel() {
                            emit('cancel');
                        },
                        onSubmit() {
                            formRef.value.validate((isValid, resData) => {
                                if (isValid) {
                                    return emit('submit', formData);
                                }
                                console.warn(resData);
                                return emit('validation-failed', resData);
                            });
                        }
                    });
                }

                return [];
            };


            const childProps = computed(() => {
                const { layoutColumn = 1, ...formProps } = props.formProps;
                const schemaProps = {
                    schema: props.schema,
                    uiSchema: props.uiSchema,
                    errorSchema: props.errorSchema,
                    customFormats: props.customFormats,
                    customRule: props.customRule,
                    rootSchema: props.schema,
                    rootFormData: formData.value, // 根节点的数据
                    curNodePath: '', // 当前节点路径
                    globalOptions, // 全局配置，差异化ui框架
                    formProps: {
                        labelPosition: 'top',
                        labelSuffix: '：',
                        ...formProps,
                    }
                };

                return {
                    layoutColumn,
                    schemaProps,
                };
            });


            return () => h(
                resolveComponent(globalOptions.COMPONENT_MAP.form),
                {
                    class: {
                        genFromComponent: true,
                        [`formLabel-${childProps.value.schemaProps.formProps.labelPosition}`]: true,
                        formInlineFooter: childProps.value.schemaProps.formProps.inlineFooter,
                        formInline: childProps.value.schemaProps.inline,
                        [`genFromComponent_${props.schema.id}Form`]: !!props.schema.id,
                        layoutColumn: !childProps.value.schemaProps.inline,
                        [`layoutColumn-${childProps.layoutColumn}`]: !childProps.value.schemaProps.inline
                    },
                    ref: formRef,
                    model: formData,
                    ...childProps.value.schemaProps.formProps
                },
                {
                    default: () => [
                        h(
                            SchemaField,
                            {
                                ...childProps.value.schemaProps
                            }
                        ),
                        getDefaultSlot(),
                    ]
                }
            );
        },
    };

    Form.install = (vueApp, options = {}) => {
        vueApp.component(options.name || Form.name, Form);
    };

    return Form;
}
