export abstract class OnMount {
    abstract dynamicOnMount(attrs?: Map<string, string>, content?: string, element?: Element): void;
}