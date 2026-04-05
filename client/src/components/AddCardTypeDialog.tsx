import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { IconMap } from "@/lib/icon-map";
import { useCreateCardType } from "@/hooks/use-card-types";

const addCardTypeSchema = z.object({
    slug: z.string().min(1, "Required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
    label: z.string().min(1, "Required"),
    description: z.string().optional(),
    icon: z.string().min(1, "Required"),
    color: z.string().min(1, "Required"),
});

const PRESET_COLORS = [
    { label: "Blue", value: "text-blue-500 bg-blue-500/10 border-blue-200" },
    { label: "Green", value: "text-green-500 bg-green-500/10 border-green-200" },
    { label: "Orange", value: "text-orange-500 bg-orange-500/10 border-orange-200" },
    { label: "Red", value: "text-red-500 bg-red-500/10 border-red-200" },
    { label: "Purple", value: "text-purple-500 bg-purple-500/10 border-purple-200" },
    { label: "Pink", value: "text-pink-500 bg-pink-500/10 border-pink-200" },
    { label: "Indigo", value: "text-indigo-500 bg-indigo-500/10 border-indigo-200" },
    { label: "Teal", value: "text-teal-500 bg-teal-500/10 border-teal-200" },
];

export function AddCardTypeDialog() {
    const [open, setOpen] = useState(false);
    const mutation = useCreateCardType();

    const form = useForm({
        resolver: zodResolver(addCardTypeSchema),
        defaultValues: {
            slug: "",
            label: "",
            description: "",
            icon: "FileText",
            color: PRESET_COLORS[0].value,
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Type
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Card Type</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) =>
                            mutation.mutate(data, {
                                onSuccess: () => {
                                    setOpen(false);
                                    form.reset();
                                },
                            }),
                        )}
                        className="space-y-4 pt-4"
                    >
                        <FormField
                            control={form.control}
                            name="label"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. Health Card" onChange={(e) => {
                                            field.onChange(e);
                                            // Auto-generate slug
                                            if (!form.getValues("slug")) {
                                                form.setValue("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                                            }
                                        }} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Identifier (Unique)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. health-card" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="icon"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Icon</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Icon" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <div className="max-h-[200px] overflow-y-auto">
                                                    {Object.keys(IconMap).map((iconName) => (
                                                        <SelectItem key={iconName} value={iconName}>
                                                            <span className="flex items-center gap-2">
                                                                {/* Render icon preview? No easily doable inside SelectItem text without component lookup again */}
                                                                {iconName}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </div>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="color"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Color Theme</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Color" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {PRESET_COLORS.map((c) => (
                                                    <SelectItem key={c.label} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Brief description..." />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Creating..." : "Create Type"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
