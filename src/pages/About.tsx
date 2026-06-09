import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LeifMascot } from "@/components/LeifMascot";

function RefLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-lg bg-card-2/60 px-3 py-2 text-sm font-medium text-fg ring-1 ring-border transition hover:bg-card"
    >
      {label}
      <ExternalLink className="h-4 w-4" />
    </a>
  );
}

export default function AboutPage() {
  return (
    <div className="grid gap-6">
      <div>
        <div className="font-display text-2xl tracking-tight text-fg">Sobre / Avisos</div>
        <div className="mt-1 text-sm text-muted">
          Um app para organização alimentar, hábitos e educação nutricional. Não substitui acompanhamento profissional.
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-card/90 to-card-2/55 p-6 ring-1 ring-gold/25 shadow-crisp animate-fade-up sm:flex-row sm:items-center">
        <div className="h-44 w-36 shrink-0 drop-shadow-md">
          <LeifMascot variant="full" mood="celebrate" className="h-full w-full" />
        </div>
        <div className="text-center sm:text-left">
          <div className="font-display text-3xl font-black tracking-wide">
            <span className="text-fg">Leif</span>
            <span className="text-accent">Nutri</span>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Eu sou <span className="font-semibold text-gold">Leif</span>, seu guia nas batalhas alimentares. Organize refeições,
            acompanhe metas e conquiste hábitos saudáveis — com a disciplina de um verdadeiro guerreiro nórdico.
          </p>
          <p className="mt-2 text-xs italic text-muted">"Não há glória sem sacrifício. Não há vitória sem preparo."</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Limites do app</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted">
            <div>As recomendações são estimativas e podem não refletir necessidades clínicas individuais.</div>
            <div>Metas e alertas não são diagnóstico. Ajuste de dieta deve considerar exames, medicações e histórico.</div>
            <div>Em caso de sintomas, dor, tontura, hipoglicemia, falta de ar ou piora do quadro, procure atendimento.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quando procurar um profissional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted">
            <div>Condições como diabetes, hipertensão, doença renal, gestação e transtornos alimentares.</div>
            <div>Se você usa medicações com risco de hipoglicemia ou tem metas agressivas de perda de peso.</div>
            <div>Para ajustar calorias e micronutrientes com segurança e personalização.</div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Privacidade</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted">
            <div>
              Por padrão, seus dados (perfil, plano, histórico) ficam salvos localmente no seu navegador. Você pode exportar e apagar a qualquer momento.
            </div>
            <div>Este app não solicita dados pessoais desnecessários.</div>
            <div>
              Quando a sincronização em nuvem for ativada, você verá claramente o que será enviado e terá opção de desligar.
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fontes e referências</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <RefLink href="https://www.who.int/" label="OMS (WHO)" />
            <RefLink href="https://www.gov.br/saude/pt-br" label="Ministério da Saúde" />
            <RefLink href="https://www.gov.br/saude/pt-br/assuntos/saude-brasil/eu-quero-me-alimentar-melhor" label="Alimentação saudável" />
            <RefLink href="https://bvsms.saude.gov.br/" label="BVS/MS" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

