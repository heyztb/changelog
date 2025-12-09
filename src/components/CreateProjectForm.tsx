"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { useConnection } from "wagmi";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";
import {
  EAS,
  SchemaEncoder,
  SchemaRegistry,
  NO_EXPIRATION,
} from "@ethereum-attestation-service/eas-sdk-v2";
import { EAS_BASE_ADDRESS, EAS_PROJECT_SCHEMA } from "@/lib/constants";
import { useUserProjects } from "@/hooks/useUserProjects";
import { useEthersSigner } from "@/hooks/useEthersSigner";

const formSchema = z.object({
  name: z
    .string()
    .min(1, "Project name must be at least 1 character.")
    .max(32, "Project name must be at most 32 characters."),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters.")
    .max(180, "Description must be at most 100 characters."),
  website: z.httpUrl("Invalid URL"),
  creator: z.templateLiteral(["0x", z.string().length(40)]),
  createdAt: z.date(),
});

export function CreateProjectForm() {
  const { address, connector } = useConnection();
  const signer = useEthersSigner();
  const { addProject } = useUserProjects();
  const form = useForm({
    defaultValues: {
      name: "Changelog",
      description: "A place for builders to share what they're working on",
      website: "https://github.com/heyztb/changelog",
      creator: address ?? "",
      createdAt: new Date(),
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      if (!connector) {
        toast.error("Please connect your wallet");
        return;
      }
      if (!signer) {
        toast.error("Please connect your wallet");
        return;
      }
      const eas = new EAS(EAS_BASE_ADDRESS);
      eas.connect(signer);
      const schemaEncoder = new SchemaEncoder(EAS_PROJECT_SCHEMA);
      toast.promise(
        async () => {
          const encodedData = schemaEncoder.encodeData([
            { name: "name", value: value.name, type: "string" },
            { name: "description", value: value.description, type: "string" },
            { name: "website", value: value.website, type: "string" },
            {
              name: "creator",
              value: value.creator,
              type: "address",
            },
            {
              name: "createdAt",
              value: value.createdAt.getTime(),
              type: "uint256",
            },
          ]);
          try {
            const tx = await eas.attest({
              schema: EAS_PROJECT_SCHEMA,
              data: {
                recipient: "",
                expirationTime: NO_EXPIRATION,
                revocable: false,
                data: encodedData,
              },
            });
            const attestation = await tx.wait(1);
            addProject(value.name);
            return { success: true, attestation };
          } catch (error) {
            console.error(error);
          }
        },
        {
          loading: "Creating project...",
          success: "Project created successfully",
          position: "top-center",
          classNames: {
            content: "flex flex-col gap-2",
          },
          style: {
            "--border-radius": "calc(var(--radius)  + 4px)",
          } as React.CSSProperties,
        },
      );
    },
  });

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Create a Project</CardTitle>
        <CardDescription>
          All projects and associated records are stored onchain. Create a new
          project by filling out the form below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="create-project-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Project Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      minLength={1}
                      maxLength={32}
                      placeholder="Your project name"
                      autoComplete="off"
                      aria-autocomplete="none"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="description"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <InputGroup>
                      <InputGroupTextarea
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="A brief description of your project, i.e what it is, the problem it solves, etc."
                        rows={6}
                        className="min-h-14 resize-none"
                        minLength={20}
                        maxLength={180}
                        aria-invalid={isInvalid}
                        autoComplete="off"
                        aria-autocomplete="none"
                      />
                      <InputGroupAddon align="block-end">
                        <InputGroupText className="tabular-nums">
                          {field.state.value.length}/180 characters
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
            <form.Field
              name="website"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>
                      Website or Repo
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="https://github.com/username/repo"
                      autoComplete="off"
                      aria-autocomplete="none"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="submit" form="create-project-form" className="w-full">
            Submit
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
