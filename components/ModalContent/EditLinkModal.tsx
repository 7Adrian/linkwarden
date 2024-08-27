import React, { useEffect, useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import TextInput from "@/components/TextInput";
import unescapeString from "@/lib/client/unescapeString";
import {
  ArchivedFormat,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import Link from "next/link";
import Modal from "../Modal";
import { useTranslation } from "next-i18next";
import { useUpdateLink } from "@/hooks/store/links";
import toast from "react-hot-toast";
import IconPicker from "../IconPicker";
import { IconWeight } from "@phosphor-icons/react";
import Image from "next/image";
import { previewAvailable } from "@/lib/shared/getArchiveValidity";

type Props = {
  onClose: Function;
  activeLink: LinkIncludingShortenedCollectionAndTags;
};

export default function EditLinkModal({ onClose, activeLink }: Props) {
  const { t } = useTranslation();
  const [link, setLink] =
    useState<LinkIncludingShortenedCollectionAndTags>(activeLink);

  let shortenedURL;
  try {
    shortenedURL = new URL(link.url || "").host.toLowerCase();
  } catch (error) {
    console.log(error);
  }

  const [submitLoader, setSubmitLoader] = useState(false);

  const updateLink = useUpdateLink();

  const setCollection = (e: any) => {
    if (e?.__isNew__) e.value = null;
    setLink({
      ...link,
      collection: { id: e?.value, name: e?.label, ownerId: e?.ownerId },
    });
  };

  const setTags = (e: any) => {
    const tagNames = e.map((e: any) => ({ name: e.label }));
    setLink({ ...link, tags: tagNames });
  };

  useEffect(() => {
    setLink(activeLink);
  }, []);

  const submit = async () => {
    if (!submitLoader) {
      setSubmitLoader(true);

      const load = toast.loading(t("updating"));

      await updateLink.mutateAsync(link, {
        onSettled: (data, error) => {
          toast.dismiss(load);

          if (error) {
            toast.error(error.message);
          } else {
            onClose();
            toast.success(t("updated"));
          }
        },
      });

      setSubmitLoader(false);
    }
  };

  return (
    <Modal toggleModal={onClose}>
      <p className="text-xl font-thin">{t("edit_link")}</p>

      <div className="divider mb-3 mt-1"></div>

      {link.url && (
        <Link
          href={link.url}
          className="truncate text-neutral flex gap-2 mb-5 w-fit max-w-full"
          title={link.url}
          target="_blank"
        >
          <i className="bi-link-45deg text-xl" />
          <p>{shortenedURL}</p>
        </Link>
      )}

      <div className="w-full">
        <p className="mb-2">{t("name")}</p>
        <TextInput
          value={link.name}
          onChange={(e) => setLink({ ...link, name: e.target.value })}
          placeholder={t("placeholder_example_link")}
          className="bg-base-200"
        />
      </div>

      <div className="mt-5">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="mb-2">{t("collection")}</p>
            {link.collection.name && (
              <CollectionSelection
                onChange={setCollection}
                defaultValue={
                  link.collection.id
                    ? { value: link.collection.id, label: link.collection.name }
                    : { value: null as unknown as number, label: "Unorganized" }
                }
                creatable={false}
              />
            )}
          </div>

          <div>
            <p className="mb-2">{t("tags")}</p>
            <TagSelection
              onChange={setTags}
              defaultValue={link.tags.map((e) => ({
                label: e.name,
                value: e.id,
              }))}
            />
          </div>

          <div className="sm:col-span-2">
            <p className="mb-2">{t("description")}</p>
            <textarea
              value={unescapeString(link.description) as string}
              onChange={(e) =>
                setLink({ ...link, description: e.target.value })
              }
              placeholder={t("link_description_placeholder")}
              className="resize-none w-full rounded-md p-2 h-32 border-neutral-content bg-base-200 focus:border-primary border-solid border outline-none duration-100"
            />
          </div>

          <div>
            <p className="mb-2">{t("icon_and_preview")}</p>
            <div className="flex gap-3">
              <IconPicker
                hideDefaultIcon
                color={link.color || "#0ea5e9"}
                setColor={(color: string) => setLink({ ...link, color })}
                weight={(link.iconWeight || "regular") as IconWeight}
                setWeight={(iconWeight: string) =>
                  setLink({ ...link, iconWeight })
                }
                iconName={link.icon as string}
                setIconName={(icon: string) => setLink({ ...link, icon })}
                reset={() =>
                  setLink({
                    ...link,
                    color: "",
                    icon: "",
                    iconWeight: "",
                  })
                }
                alignment="-top-10 translate-x-20"
              />

              {previewAvailable(link) ? (
                <Image
                  src={`/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true`}
                  width={1280}
                  height={720}
                  alt=""
                  className="object-cover h-20 w-32 rounded-lg opacity-80"
                  onError={(e) => {
                    const target = e.target as HTMLElement;
                    target.style.display = "none";
                  }}
                />
              ) : link.preview === "unavailable" ? (
                <div className="bg-gray-50 duration-100 h-20 w-32 bg-opacity-80 rounded-lg flex flex-col justify-center">
                  <p className="text-black text-sm text-center">
                    {t("preview_unavailable")}
                  </p>
                </div>
              ) : (
                <div className="duration-100 h-20 w-32 bg-opacity-80 skeleton rounded-lg"></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end items-center mt-5">
        <button
          className="btn btn-accent dark:border-violet-400 text-white"
          onClick={submit}
        >
          {t("save_changes")}
        </button>
      </div>
    </Modal>
  );
}
