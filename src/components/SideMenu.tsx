
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const SideMenu = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 left-4 z-50 bg-black/20 border-white/20 text-white hover:bg-white/10"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 bg-black/90 text-white border-white/20">
        <SheetHeader>
          <SheetTitle className="text-white text-xl">Меню</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-4">
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Описание
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Пирамида Тота
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Храм Маат
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Павлова С.Н.
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Обучение
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Записаться в пирамиду
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Новости
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Выездные семинары
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10">
              Регистрация на форуме
            </Button>
          </div>
          
          <div className="border-t border-white/20 pt-4 space-y-2">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">Наши проекты</h3>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 pl-6">
              Башня лордов
            </Button>
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 pl-6">
              Школа Isais
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SideMenu;
